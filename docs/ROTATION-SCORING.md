# Rotation scoring — logic on paper (PSEUDOCODE ONLY, not implemented)

**Purpose:** score 3 crop rotations for a Punjab wheat farmer so the tool can
recommend one and show WHY. All scoring is deterministic and transparent —
no ML, no LLM, no invented coefficients. Where a number comes from the yield
model it is labelled; where it is a transparent rule it is labelled as a rule.

## Inputs (exact NASA variables needed)

| Variable | Source | Endpoint | Use |
|---|---|---|---|
| `T2M` (°C, daily) | NASA POWER | `temporal/daily/point`, community `AG` | Heat accumulation (GDD), heat-stress days |
| `PRECTOTCORR` (mm/day, daily) | NASA POWER | same | Monsoon onset detection, water availability |
| `WS2M` (m/s, daily) | NASA POWER | same | Evapotranspiration proxy (with T2M) |
| `T2M`, `PRECTOTCORR` (monthly climatology) | NASA POWER | `temporal/climatology/point` | "Hotter/drier than normal" baseline |
| Soil moisture (m³/m³, current) | SMAP L3 (or Open-Meteo ERA5 fallback, labelled) | NSIDC / Open-Meteo | Current field condition |
| (optional) LST / ESI | ECOSTRESS `ECO_L2T_LSTE` / `ECO_L4T_ESI` | CMR + Earthdata download | Water/heat stress, pre-computed + badged |

**Agronomic constants (his verified model):**
- Wheat baseline yield: **3.12 t/ha** (AgriYield Advisor, backtest MAE 0.090)
- Wheat base temperature for growing-degree-days: **5 °C** (standard for wheat)
- Wheat heat-stress threshold: **T2M daily mean > 32 °C** during grain fill (rule, labelled)

## The Shift (growing-window shift, in days)

```
ONSET RULE (defined here, shown in the app):
  monsoon_onset(year) = first day D after June 1 such that
    PRECTOTCORR[D] + PRECTOTCORR[D+1] + PRECTOTCORR[D+2] >= 7.5 mm
    (i.e. 3-day total >= 2.5 mm/day average)

SHIFT:
  onset_2004 = monsoon_onset(2004)            # baseline year, POWER daily
  onset_recent = median(monsoon_onset(2023), monsoon_onset(2024), monsoon_onset(2025))
  shift_days = onset_recent - onset_2004       # +N = onset later than 2004

TREND TEST (shown with the number):
  years = 2004..2025
  onsets = [monsoon_onset(y) for y in years]   # skip years with no onset found
  slope, p_value = ordinary_least_squares(years, onsets)
  # report: "onset is shifting +X.X days/year (p = 0.0Y)"
  # if p >= 0.05, say so honestly: "trend not statistically significant"

HEAT CHECK:
  gdd_season(year) = sum(max(T2M[d] - 5, 0)) for d in Oct 15..Apr 15 (rabi season)
  heat_days(year)  = count(T2M[d] > 32) for d in Mar 1..Apr 15 (grain fill)
  # report alongside the shift: "grain-fill heat days: 2004 = A, recent = B"
```

**Data hygiene:** POWER returns `-999` for missing days (verified: ~2-day lag).
Skip `-999` days in every sum/count; if >10% of a season is missing, show
"insufficient data for <year>" instead of a number.

## Rotation scoring

**Rotations compared:**
- R1: Wheat → Cotton
- R2: Wheat → Pulses (moong / masoor)
- R3: Wheat → Maize

**Score dimensions (each 0–10, higher = better for the farmer):**

```
WATER (uses PRECTOTCORR + climatology):
  water_need = { Cotton: 9, Pulses: 3, Maize: 7 }        # relative, labelled rule
  water_available = mean(PRECTOTCORR, Jun–Sep recent) / mean(PRECTOTCORR, Jun–Sep climatology)
  water_score = clamp(10 - water_need * (1.2 - water_available), 0, 10)
  # drier-than-normal monsoon punishes thirsty crops; pulses barely care

SOIL (transparent rules, labelled):
  soil_effect = { Cotton: -2, Pulses: +3, Maize: -1 }    # pulses fix nitrogen
  soil_score = clamp(5 + soil_effect, 0, 10)

HEAT (uses T2M):
  heat_tolerance = { Cotton: 8, Pulses: 6, Maize: 5 }    # relative, labelled rule
  heat_pressure = heat_days(recent) / heat_days(2004)    # >1 = hotter grain fill
  # ZERO-BASELINE GUARD (added during sprint, Nov 14, 2026 — verified real):
  # the 2004-05 grain fill genuinely had 0 days > 32 °C (max T2M 27.89 °C,
  # Mar 1–Apr 15 2005, NASA POWER live check), so the raw ratio is undefined.
  # Floor the baseline at 1 day and CAP the ratio at 2.0x (labelled rule),
  # shown in the UI next to the heat numbers. Without the cap every rotation
  # scores 0 on heat and the dimension stops discriminating.
  heat_score = clamp(heat_tolerance - 2 * (heat_pressure - 1), 0, 10)

MARGIN (uses the yield model where it applies):
  wheat_yield = 3.12 t/ha                                 # verified model baseline
  # rotation yield is NOT modelled — report it as a range from the rule table
  # and label it "indicative, from agronomic rules — not a model prediction":
  margin_score = { Cotton: 7, Pulses: 6, Maize: 8 }      # relative, labelled rule

TOTAL:
  total = 0.35*water + 0.25*soil + 0.25*heat + 0.15*margin
  # weights are shown in the UI; the winner is the highest total
```

**Output per rotation:** total score (0–10), the four dimension scores, and a
one-line reason ("Wins on water + soil; loses on margin"). The winner is
highlighted; the other two stay visible with their scores.

## Adaptation Margin (stress test — the "wow" number)

```
margin_test(rotation):
  for shift in 0..30 days:                     # push planting later, day by day
    window = rabi_window(planting = Oct 15 + shift)
    feasible = (gdd_season(window) >= gdd_needed[wheat])
               AND (water_available(window) >= water_need[rotation])
               AND (heat_days(window) <= heat_limit)
    if not feasible: return shift - 1          # last surviving day
  return 30                                     # survives the full test

# report: "Wheat–Pulses still works if planting slips 14 days; Wheat–Cotton
#  fails after 6 days."  One number per rotation, computed live.
```

## What is NOT in this logic (deliberately)

- No trained ML rotation model (does not exist; the wheat model covers wheat only).
- No invented yields for cotton/pulses/maize — margin is a labelled relative rule.
- No soil-health sensor data — soil scores are transparent agronomic rules.
- No farmer validation data — zero pilot users; the app says so.
