import { describe, expect, it } from 'vitest';
import {
  adaptationMargin,
  heatPressureFromCounts,
  marginFeasible,
  scoreRotations,
  type MarginInputs,
  type RotationId,
} from '../lib/rotation';

function byId(id: RotationId) {
  return (s: { id: RotationId }) => s.id === id;
}

/** Build a daily series starting 2024-10-15 (rabi planting) for `days` days. */
function makeSeries(
  days: number,
  t2m: (date: string, i: number) => number | null = () => 20,
): MarginInputs['rabiDaily'] {
  const out: MarginInputs['rabiDaily'] = [];
  const start = Date.UTC(2024, 9, 15); // 2024-10-15
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * 86_400_000);
    const date = d.toISOString().slice(0, 10);
    out.push({ date, t2m: t2m(date, i), rain: 1 });
  }
  return out;
}

describe('scoreRotations', () => {
  it('punishes thirsty cotton on water when dry (waterAvailable 0.8)', () => {
    const scores = scoreRotations({ waterAvailable: 0.8, heatPressure: 1.3 });
    const cotton = scores.find(byId('wheat-cotton'))!;
    const pulses = scores.find(byId('wheat-pulses'))!;
    const maize = scores.find(byId('wheat-maize'))!;
    // water = 10 - need * (1.2 - 0.8): cotton 6.4, pulses 8.8, maize 7.2
    expect(cotton.water).toBeCloseTo(6.4, 1);
    expect(pulses.water).toBeCloseTo(8.8, 1);
    expect(maize.water).toBeCloseTo(7.2, 1);
    expect(cotton.water).toBeLessThan(pulses.water);
    expect(cotton.water).toBeLessThan(maize.water);
  });

  it('pulses win on soil (nitrogen fixing)', () => {
    const scores = scoreRotations({ waterAvailable: 1, heatPressure: 1 });
    const pulses = scores.find(byId('wheat-pulses'))!;
    const cotton = scores.find(byId('wheat-cotton'))!;
    const maize = scores.find(byId('wheat-maize'))!;
    expect(pulses.soil).toBe(8); // 5 + 3
    expect(cotton.soil).toBe(3); // 5 - 2
    expect(maize.soil).toBe(4); // 5 - 1
    expect(pulses.soil).toBeGreaterThan(cotton.soil);
    expect(pulses.soil).toBeGreaterThan(maize.soil);
  });

  it('heat score falls when heatPressure > 1', () => {
    const calm = scoreRotations({ waterAvailable: 1, heatPressure: 1 });
    const hot = scoreRotations({ waterAvailable: 1, heatPressure: 1.5 });
    for (const id of ['wheat-cotton', 'wheat-pulses', 'wheat-maize'] as RotationId[]) {
      const before = calm.find(byId(id))!;
      const after = hot.find(byId(id))!;
      // heat = tolerance - 2 * (pressure - 1): drops by exactly 1.0
      expect(after.heat).toBeCloseTo(before.heat - 1, 1);
      expect(after.heat).toBeLessThan(before.heat);
    }
    // Spot values at pressure 1.5: cotton 7, pulses 5, maize 4
    expect(hot.find(byId('wheat-cotton'))!.heat).toBeCloseTo(7, 1);
    expect(hot.find(byId('wheat-pulses'))!.heat).toBeCloseTo(5, 1);
    expect(hot.find(byId('wheat-maize'))!.heat).toBeCloseTo(4, 1);
  });

  it('totals are the weighted sum (hand-computed, waterAvailable 1.0, heatPressure 1.0)', () => {
    // Cotton: .35*8.2 + .25*3 + .25*8 + .15*7 = 6.67 -> 6.7
    // Pulses: .35*9.4 + .25*8 + .25*6 + .15*6 = 7.69 -> 7.7
    // Maize:  .35*8.6 + .25*4 + .25*5 + .15*8 = 6.46 -> 6.5
    const scores = scoreRotations({ waterAvailable: 1, heatPressure: 1 });
    expect(scores.find(byId('wheat-cotton'))!.total).toBeCloseTo(6.7, 1);
    expect(scores.find(byId('wheat-pulses'))!.total).toBeCloseTo(7.7, 1);
    expect(scores.find(byId('wheat-maize'))!.total).toBeCloseTo(6.5, 1);
  });

  it('returns the winner first and sorts best-first (sample: 0.8 / 1.3)', () => {
    const scores = scoreRotations({ waterAvailable: 0.8, heatPressure: 1.3 });
    // Pulses 7.3, cotton 5.9, maize 5.8 (hand-computed)
    expect(scores[0].id).toBe('wheat-pulses');
    expect(scores[0].total).toBeCloseTo(7.3, 1);
    expect(scores[1].id).toBe('wheat-cotton');
    expect(scores[1].total).toBeCloseTo(5.9, 1);
    expect(scores[2].id).toBe('wheat-maize');
    expect(scores[2].total).toBeCloseTo(5.8, 1);
    expect(scores[0].total).toBeGreaterThanOrEqual(scores[1].total);
    expect(scores[1].total).toBeGreaterThanOrEqual(scores[2].total);
    // Spec example reason for the winner
    expect(scores[0].reason).toBe('Wins on water + soil; loses on margin');
  });

  it('carries the spec names and Urdu names', () => {
    const scores = scoreRotations({ waterAvailable: 1, heatPressure: 1 });
    expect(scores.find(byId('wheat-cotton'))!.name).toBe('Wheat → Cotton');
    expect(scores.find(byId('wheat-cotton'))!.nameUrdu).toBe('گندم → کپاس');
    expect(scores.find(byId('wheat-pulses'))!.name).toBe('Wheat → Pulses');
    expect(scores.find(byId('wheat-pulses'))!.nameUrdu).toBe('گندم → دالیں');
    expect(scores.find(byId('wheat-maize'))!.name).toBe('Wheat → Maize');
    expect(scores.find(byId('wheat-maize'))!.nameUrdu).toBe('گندم → مکئی');
  });

  it('keeps every score in [0, 10] and totals rounded to 1 decimal', () => {
    for (const waterAvailable of [0, 0.5, 1, 1.5, 2, 5]) {
      for (const heatPressure of [0, 0.5, 1, 2, 3, 10]) {
        for (const s of scoreRotations({ waterAvailable, heatPressure })) {
          for (const v of [s.water, s.soil, s.heat, s.margin, s.total]) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(10);
          }
          // Rounded to 1 decimal: total * 10 is (very nearly) an integer.
          expect(Math.abs(s.total * 10 - Math.round(s.total * 10))).toBeLessThan(1e-9);
          expect(typeof s.reason).toBe('string');
          expect(s.reason.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('adaptationMargin', () => {
  it('returns 30 when the series is uniformly benign', () => {
    const inputs: MarginInputs = { rabiDaily: makeSeries(230, () => 20), waterAvailable: 1 };
    for (const id of ['wheat-cotton', 'wheat-pulses', 'wheat-maize'] as RotationId[]) {
      expect(adaptationMargin(id, inputs)).toBe(30);
    }
  });

  it('returns 0 when the very first shifted window fails (water too low for cotton)', () => {
    const inputs: MarginInputs = { rabiDaily: makeSeries(230, () => 20), waterAvailable: 0.1 };
    // 0.1 * 10 = 1 < cotton need 9, so even shift 0 fails -> 0
    expect(adaptationMargin('wheat-cotton', inputs)).toBe(0);
    expect(marginFeasible('wheat-cotton', inputs, 0)).toBe(false);
  });

  it('lets low-need pulses survive where cotton fails on water', () => {
    const inputs: MarginInputs = { rabiDaily: makeSeries(230, () => 20), waterAvailable: 0.5 };
    expect(adaptationMargin('wheat-cotton', inputs)).toBe(0); // 5 < 9
    expect(adaptationMargin('wheat-pulses', inputs)).toBe(30); // 5 >= 3
    expect(adaptationMargin('wheat-maize', inputs)).toBe(0); // 5 < 7
  });

  it('returns 0 for an empty or too-short series (insufficient data)', () => {
    expect(adaptationMargin('wheat-pulses', { rabiDaily: [], waterAvailable: 1 })).toBe(0);
    // 100 days cannot cover the 183-day baseline window, let alone +30 shift
    expect(
      adaptationMargin('wheat-pulses', { rabiDaily: makeSeries(100, () => 20), waterAvailable: 1 }),
    ).toBe(0);
  });

  it('returns 0 when heat spikes just after the baseline grain-fill window', () => {
    // 20 °C through Apr 15, then 35 °C: baseline grain-fill has 0 heat days,
    // so any shifted grain-fill containing a hot day exceeds 1.5 x 0 = 0.
    const series = makeSeries(230, (date) => (date >= '2025-04-16' ? 35 : 20));
    const inputs: MarginInputs = { rabiDaily: series, waterAvailable: 1 };
    expect(marginFeasible('wheat-pulses', inputs, 0)).toBe(true);
    expect(marginFeasible('wheat-pulses', inputs, 1)).toBe(false);
    expect(adaptationMargin('wheat-pulses', inputs)).toBe(0);
  });

  it('returns a partial margin when heat days grow gradually with the shift', () => {
    // Grain-fill Mar 1–10 hot (10 heat days baseline, limit 15), then 20 °C,
    // then hot again from Apr 16. Shifted grain-fill heat days = 10 for
    // shift <= 10, then = shift; first exceeds 15 at shift 16 -> margin 15.
    const series = makeSeries(230, (date) => {
      if (date >= '2025-03-01' && date <= '2025-03-10') return 35;
      if (date >= '2025-04-16') return 35;
      return 20;
    });
    const inputs: MarginInputs = { rabiDaily: series, waterAvailable: 1 };
    expect(adaptationMargin('wheat-pulses', inputs)).toBe(15);
  });

  it('rejects out-of-range shifts in the helper', () => {
    const inputs: MarginInputs = { rabiDaily: makeSeries(230, () => 20), waterAvailable: 1 };
    expect(marginFeasible('wheat-pulses', inputs, -1)).toBe(false);
    expect(marginFeasible('wheat-pulses', inputs, 31)).toBe(false);
    expect(marginFeasible('wheat-pulses', inputs, 30)).toBe(true);
  });
});

describe('waterAvailable cap for scoring (WIN-STRATEGY M3, Nov 14, 2026)', () => {
  it('caps the scoring water input at 1.0: 2.12 scores identically to 1.0', () => {
    const wet = scoreRotations({ waterAvailable: 2.12, heatPressure: 2 });
    const capped = scoreRotations({ waterAvailable: 1.0, heatPressure: 2 });
    expect(wet).toEqual(capped);
    // And any surplus above 1.0 collapses to the same scores.
    expect(scoreRotations({ waterAvailable: 5, heatPressure: 2 })).toEqual(capped);
    expect(scoreRotations({ waterAvailable: 2, heatPressure: 2 })).toEqual(capped);
  });

  it('recomputed Faisalabad totals with the cap (waterAvailable 2.12, heatPressure 2.0)', () => {
    // water = 10 - need * (1.2 - 1.0): cotton 8.2, pulses 9.4, maize 8.6
    // heat (pressure 2.0): cotton 6, pulses 4, maize 3
    // totals: pulses 7.2, cotton 6.2, maize 6.0 — winner unchanged (Pulses).
    const scores = scoreRotations({ waterAvailable: 2.12, heatPressure: 2 });
    expect(scores.find(byId('wheat-pulses'))!.water).toBeCloseTo(9.4, 1);
    expect(scores.find(byId('wheat-cotton'))!.water).toBeCloseTo(8.2, 1);
    expect(scores.find(byId('wheat-maize'))!.water).toBeCloseTo(8.6, 1);
    expect(scores.find(byId('wheat-pulses'))!.total).toBeCloseTo(7.2, 1);
    expect(scores.find(byId('wheat-cotton'))!.total).toBeCloseTo(6.2, 1);
    expect(scores.find(byId('wheat-maize'))!.total).toBeCloseTo(6.0, 1);
    expect(scores[0].id).toBe('wheat-pulses');
    // Water now discriminates: no longer 10.0 / 10.0 / 10.0.
    const waters = scores.map((s) => s.water);
    expect(new Set(waters).size).toBe(3);
  });

  it('margins are unchanged by the cap (2.12 vs 1.0 give identical margins)', () => {
    // Benign series: every rotation survives the full 30-day test either way.
    const benign = makeSeries(230, () => 20);
    for (const id of ['wheat-cotton', 'wheat-pulses', 'wheat-maize'] as RotationId[]) {
      expect(adaptationMargin(id, { rabiDaily: benign, waterAvailable: 2.12 })).toBe(30);
      expect(adaptationMargin(id, { rabiDaily: benign, waterAvailable: 1.0 })).toBe(30);
    }
    // Partial-margin series (heat grows with the shift): pulses margin 15.
    const gradual = makeSeries(230, (date) => {
      if (date >= '2025-03-01' && date <= '2025-03-10') return 35;
      if (date >= '2025-04-16') return 35;
      return 20;
    });
    for (const id of ['wheat-cotton', 'wheat-pulses', 'wheat-maize'] as RotationId[]) {
      expect(adaptationMargin(id, { rabiDaily: gradual, waterAvailable: 2.12 })).toBe(
        adaptationMargin(id, { rabiDaily: gradual, waterAvailable: 1.0 }),
      );
    }
    expect(adaptationMargin('wheat-pulses', { rabiDaily: gradual, waterAvailable: 2.12 })).toBe(15);
  });
});

describe('heatPressureFromCounts (zero-baseline guard)', () => {
  it('caps the ratio at 2.0x when the baseline is 0 (Faisalabad 2004-05: 5 recent vs 0 baseline)', () => {
    expect(heatPressureFromCounts(5, 0)).toBe(2.0);
  });

  it('returns the plain ratio when the baseline is non-zero and below the cap', () => {
    expect(heatPressureFromCounts(5, 5)).toBe(1);
    expect(heatPressureFromCounts(2, 4)).toBe(0.5);
  });

  it('caps a large non-zero-baseline ratio at 2.0x', () => {
    expect(heatPressureFromCounts(10, 5)).toBe(2.0);
    expect(heatPressureFromCounts(9, 5)).toBe(1.8);
  });

  it('returns 0 when there are no recent heat days', () => {
    expect(heatPressureFromCounts(0, 0)).toBe(0);
    expect(heatPressureFromCounts(0, 5)).toBe(0);
  });
});
