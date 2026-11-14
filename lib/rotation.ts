/**
 * FasalShift — rotation scoring engine (NASA Space Apps 2026, Challenge 7).
 *
 * Implements EXACTLY the logic in docs/ROTATION-SCORING.md. Deterministic,
 * transparent — no ML, no LLM, no invented coefficients.
 *
 * Labelling discipline (per the spec):
 * - "verified model": the wheat baseline yield 3.12 t/ha (AgriYield Advisor,
 *   backtest MAE 0.090). It is a wheat-only baseline; rotation yields are
 *   NOT modelled.
 * - "labelled rule": every other constant below (water needs, soil effects,
 *   heat tolerances, margin scores, window lengths, thresholds). Margin is a
 *   labelled relative rule, never a yield prediction.
 */

export type RotationId = 'wheat-cotton' | 'wheat-pulses' | 'wheat-maize';

export interface RotationScore {
  id: RotationId;
  name: string;
  nameUrdu: string;
  water: number;
  soil: number;
  heat: number;
  margin: number;
  total: number;
  reason: string;
}

export interface RotationInputs {
  /** mean Jun–Sep recent rain / mean Jun–Sep climatology rain. */
  waterAvailable: number;
  /** heatDays(recent) / heatDays(2004) over grain fill (Mar 1–Apr 15). */
  heatPressure: number;
}

export interface MarginInputs {
  /** Real recent-season daily series (NASA POWER T2M / rain). */
  rabiDaily: { date: string; t2m: number | null; rain: number | null }[];
  /** Same waterAvailable ratio as RotationInputs. */
  waterAvailable: number;
}

/** Wheat baseline yield, t/ha — verified model (AgriYield Advisor, backtest MAE 0.090). Wheat only. */
export const WHEAT_BASELINE_YIELD_T_HA = 3.12;

/** Total-score weights, shown in the UI (per spec). */
export const ROTATION_WEIGHTS = { water: 0.35, soil: 0.25, heat: 0.25, margin: 0.15 } as const;

/**
 * Zero-baseline guard for heat pressure — labelled rule (added during the
 * sprint, Nov 14, 2026). heatPressure = heatDays(recent) / heatDays(2004).
 * The 2004-05 grain fill genuinely had 0 days > 32 °C (verified live from
 * NASA POWER: max T2M 27.89 °C, Mar 1–Apr 15 2005), so the raw ratio is
 * undefined. Floor the baseline at 1 day and cap the ratio at 2.0x so the
 * heat dimension keeps discriminating instead of clamping every rotation
 * to 0. The cap is shown in the UI next to the heat numbers.
 */
export const HEAT_PRESSURE_CAP = 2.0;

/**
 * Water-availability cap for SCORING — labelled rule (added Nov 14, 2026,
 * WIN-STRATEGY M3). waterAvailable = mean Jun–Sep recent rain / mean
 * Jun–Sep climatology rain. In a wet year the ratio exceeds 1 (Faisalabad
 * 2025: 2.12×), and without a cap every rotation scored Water 10.0 — the
 * dimension stopped discriminating and the winner was decided by rules,
 * not data. Surplus rain above climatology is surplus: it cannot make a
 * thirsty crop thirstier to differentiate, so the SCORING input is capped
 * at 1.0. The DISPLAYED ratio is NOT capped (Planner keeps the true
 * waterRatio for display; only the scoring input is capped here).
 * Precedent: the 2.0× heat-pressure cap above, same reasoning.
 */
export const WATER_AVAILABLE_CAP = 1.0;
export function heatPressureFromCounts(
  recentHeatDays: number,
  baselineHeatDays: number,
): number {
  const ratio = recentHeatDays / Math.max(1, baselineHeatDays);
  return Math.min(ratio, HEAT_PRESSURE_CAP);
}

// --- Labelled-rule tables (per spec) ---------------------------------------

/** Water need, relative 0–10 — labelled rule. */
const WATER_NEED: Record<RotationId, number> = {
  'wheat-cotton': 9,
  'wheat-pulses': 3,
  'wheat-maize': 7,
};

/** Soil effect on the following wheat — labelled rule (pulses fix nitrogen). */
const SOIL_EFFECT: Record<RotationId, number> = {
  'wheat-cotton': -2,
  'wheat-pulses': 3,
  'wheat-maize': -1,
};

/** Heat tolerance, relative 0–10 — labelled rule. */
const HEAT_TOLERANCE: Record<RotationId, number> = {
  'wheat-cotton': 8,
  'wheat-pulses': 6,
  'wheat-maize': 5,
};

/**
 * Margin score, relative 0–10 — labelled rule. Rotation yields are NOT
 * modelled; this is an indicative relative rule, not a model prediction.
 */
const MARGIN_SCORE: Record<RotationId, number> = {
  'wheat-cotton': 7,
  'wheat-pulses': 6,
  'wheat-maize': 8,
};

const ROTATION_META: { id: RotationId; name: string; nameUrdu: string }[] = [
  { id: 'wheat-cotton', name: 'Wheat → Cotton', nameUrdu: 'گندم → کپاس' },
  { id: 'wheat-pulses', name: 'Wheat → Pulses', nameUrdu: 'گندم → دالیں' },
  { id: 'wheat-maize', name: 'Wheat → Maize', nameUrdu: 'گندم → مکئی' },
];

const DIMENSIONS = ['water', 'soil', 'heat', 'margin'] as const;
type Dimension = (typeof DIMENSIONS)[number];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Score all three rotations for the given inputs, best total first.
 * Dimension scores and totals are each 0–10; totals rounded to 1 decimal.
 */
export function scoreRotations(inputs: RotationInputs): RotationScore[] {
  const { waterAvailable, heatPressure } = inputs;
  // Scoring water input is capped at 1.0 (WATER_AVAILABLE_CAP, labelled
  // rule): surplus rain above climatology cannot differentiate crops.
  const waterForScoring = clamp(waterAvailable, 0, WATER_AVAILABLE_CAP);

  const raw: { meta: (typeof ROTATION_META)[number]; dims: Record<Dimension, number> }[] =
    ROTATION_META.map((meta) => {
      const water = clamp(10 - WATER_NEED[meta.id] * (1.2 - waterForScoring), 0, 10);
      const soil = clamp(5 + SOIL_EFFECT[meta.id], 0, 10);
      const heat = clamp(HEAT_TOLERANCE[meta.id] - 2 * (heatPressure - 1), 0, 10);
      const margin = MARGIN_SCORE[meta.id];
      return { meta, dims: { water, soil, heat, margin } };
    });

  const scored: RotationScore[] = raw.map(({ meta, dims }) => {
    const total = round1(
      ROTATION_WEIGHTS.water * dims.water +
        ROTATION_WEIGHTS.soil * dims.soil +
        ROTATION_WEIGHTS.heat * dims.heat +
        ROTATION_WEIGHTS.margin * dims.margin,
    );

    // Reason: dimensions where this rotation is strictly best / strictly worst
    // across the three rotations. Matches the spec's example phrasing.
    const wins: Dimension[] = [];
    const loses: Dimension[] = [];
    for (const dim of DIMENSIONS) {
      const others = raw.filter((r) => r.meta.id !== meta.id).map((r) => r.dims[dim]);
      if (dims[dim] > Math.max(...others)) wins.push(dim);
      if (dims[dim] < Math.min(...others)) loses.push(dim);
    }
    let reason: string;
    if (wins.length > 0 && loses.length > 0) {
      reason = `Wins on ${wins.join(' + ')}; loses on ${loses.join(' + ')}`;
    } else if (wins.length > 0) {
      reason = `Wins on ${wins.join(' + ')}`;
    } else if (loses.length > 0) {
      reason = `Loses on ${loses.join(' + ')}`;
    } else {
      reason = 'Balanced across all dimensions';
    }

    return {
      id: meta.id,
      name: meta.name,
      nameUrdu: meta.nameUrdu,
      water: round1(dims.water),
      soil: round1(dims.soil),
      heat: round1(dims.heat),
      margin: round1(dims.margin),
      total,
      reason,
    };
  });

  // Best first; stable sort keeps spec order (cotton, pulses, maize) on ties.
  return scored.sort((a, b) => b.total - a.total);
}

// --- Adaptation Margin (stress test) ---------------------------------------
// Per spec + task: planting = Oct 15 + shift (shift 0..30); the rabi window
// slides over the REAL recent-season daily series. A shift is feasible iff
// ALL of:
//   (a) GDD(window) >= 0.9 x GDD(baseline Oct 15 window)   [labelled rule: 0.9]
//   (b) waterAvailable x 10 >= waterNeed[rotation]        [labelled rule:
//       water covers the rotation's need; shift-independent]
//   (c) heatDays(shifted grain-fill Mar 1..Apr 15) <= heatDays(baseline
//       grain-fill) x 1.5                                  [labelled rule: 1.5]
// Return the last surviving shift day (0..30). If the series is too short /
// empty / missing, return 0 — the UI must show "insufficient data" for that
// case (a 0 here can mean "no data", not "fails immediately").

/** Wheat base temperature for GDD: 5 °C (standard for wheat, per spec). */
const WHEAT_BASE_TEMP_C = 5;
/** Wheat heat-stress threshold: daily mean T2M > 32 °C during grain fill (labelled rule, per spec). */
const HEAT_STRESS_THRESHOLD_C = 32;
/** Rabi window length: Oct 15–Apr 15 inclusive in a non-leap year — labelled rule. */
const RABI_WINDOW_DAYS = 183;
/** Grain-fill window length: Mar 1–Apr 15 inclusive — labelled rule. */
const GRAIN_FILL_DAYS = 46;
/** GDD survival factor — labelled rule. */
const GDD_SURVIVAL_FACTOR = 0.9;
/** Heat-days allowance factor — labelled rule. */
const HEAT_ALLOWANCE_FACTOR = 1.5;
/** Max share of missing (null) T2M days in a window — labelled rule (spec hygiene: >10% missing = insufficient data). */
const MAX_MISSING_FRACTION = 0.1;
/** Latest planting slip tested, days — labelled rule (per spec). */
const MAX_SHIFT_DAYS = 30;

interface WindowStats {
  gdd: number;
  heatDays: number;
  validDays: number;
  length: number;
}

function windowStats(
  series: MarginInputs['rabiDaily'],
  start: number,
  length: number,
): WindowStats | null {
  if (start < 0 || start + length > series.length) return null;
  let gdd = 0;
  let heatDays = 0;
  let validDays = 0;
  for (let i = start; i < start + length; i++) {
    const t = series[i].t2m;
    if (t === null || t === undefined || Number.isNaN(t)) continue;
    validDays++;
    gdd += Math.max(t - WHEAT_BASE_TEMP_C, 0);
    if (t > HEAT_STRESS_THRESHOLD_C) heatDays++;
  }
  return { gdd, heatDays, validDays, length };
}

function hasEnoughData(stats: WindowStats | null): stats is WindowStats {
  return stats !== null && stats.validDays >= (1 - MAX_MISSING_FRACTION) * stats.length;
}

/** Index of the first series entry whose month-day is `mm-dd`, or -1. */
function findMonthDay(series: MarginInputs['rabiDaily'], mmdd: string): number {
  return series.findIndex((d) => d.date.slice(5, 10) === mmdd);
}

/**
 * Is planting `shift` days after Oct 15 feasible for this rotation?
 * Exported so the UI/tests can check a single shift; adaptationMargin is
 * the public "last surviving day" number built on top of it.
 */
export function marginFeasible(
  rotationId: RotationId,
  inputs: MarginInputs,
  shift: number,
): boolean {
  if (!Number.isInteger(shift) || shift < 0 || shift > MAX_SHIFT_DAYS) return false;
  const series = inputs.rabiDaily;
  if (!series || series.length === 0) return false;

  const baseIdx = findMonthDay(series, '10-15');
  if (baseIdx < 0) return false;
  // Grain-fill baseline starts at the first Mar 1 after planting.
  const grainFillIdx = series.findIndex(
    (d, i) => i > baseIdx && d.date.slice(5, 10) === '03-01',
  );
  if (grainFillIdx < 0) return false;

  const baseline = windowStats(series, baseIdx, RABI_WINDOW_DAYS);
  if (!hasEnoughData(baseline)) return false;
  const baselineGrainFill = windowStats(series, grainFillIdx, GRAIN_FILL_DAYS);
  if (!hasEnoughData(baselineGrainFill)) return false;

  const shifted = windowStats(series, baseIdx + shift, RABI_WINDOW_DAYS);
  if (!hasEnoughData(shifted)) return false;
  const shiftedGrainFill = windowStats(series, grainFillIdx + shift, GRAIN_FILL_DAYS);
  if (!hasEnoughData(shiftedGrainFill)) return false;

  // (a) GDD survival — labelled rule: >= 0.9 x baseline GDD.
  if (shifted.gdd < GDD_SURVIVAL_FACTOR * baseline.gdd) return false;
  // (b) Water covers the rotation's need — labelled rule: waterAvailable x 10 >= waterNeed.
  // DECISION (WIN-STRATEGY M3, Nov 14, 2026): the 1.0 WATER_AVAILABLE_CAP is
  // deliberately NOT applied here. The cap is provably a no-op inside this
  // check: for waterAvailable >= 1.0 the capped value gives 1.0 x 10 = 10,
  // which passes every rotation's need (9 / 3 / 7) exactly as the uncapped
  // value does; for waterAvailable < 1.0 the cap changes nothing. Margins
  // are therefore identical with or without the cap (covered by test).
  if (inputs.waterAvailable * 10 < WATER_NEED[rotationId]) return false;
  // (c) Heat allowance — labelled rule: shifted grain-fill heat days <= 1.5 x baseline.
  if (shiftedGrainFill.heatDays > HEAT_ALLOWANCE_FACTOR * baselineGrainFill.heatDays) {
    return false;
  }
  return true;
}

/**
 * Adaptation Margin: last planting-slip day (0..30) that still survives.
 * Returns 30 if every shift 0..30 survives. Returns 0 if the very first
 * window fails OR the series is too short/empty — the UI must show
 * "insufficient data" when the series cannot cover the baseline window.
 */
export function adaptationMargin(rotationId: RotationId, inputs: MarginInputs): number {
  for (let shift = 0; shift <= MAX_SHIFT_DAYS; shift++) {
    if (!marginFeasible(rotationId, inputs, shift)) {
      return Math.max(shift - 1, 0);
    }
  }
  return MAX_SHIFT_DAYS;
}
