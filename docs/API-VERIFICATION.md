# NASA data sources — live verification record

**Verified:** Thu Nov 12, 2026, from this VM (curl, no credentials).
**Test point:** Faisalabad, Punjab — lat 31.4504, lon 73.1350.
**Verdict: POWER is the live backbone. IMERG/SMAP/ECOSTRESS file downloads need a
free NASA Earthdata account — plan for that, and keep the POWER-only fallback ready.**

---

## 1. NASA POWER Daily Point API — ✅ VERIFIED LIVE, no auth

**Endpoint**

```
GET https://power.larc.nasa.gov/api/temporal/daily/point
  ?parameters=T2M,PRECTOTCORR,WS2M
  &community=AG
  &longitude=73.135&latitude=31.4504
  &start=20261101&end=20261111
  &format=JSON
```

**Result:** HTTP 200, API v2.10.3, ~1.4 s. GeoJSON Feature, elevation 182.92 m.

**Sample values (real, from the verification run):**

| Date | T2M (°C) | PRECTOTCORR (mm/day) | WS2M (m/s) |
|---|---|---|---|
| 2026-11-01 | 26.53 | 0.0 | 0.99 |
| 2026-11-02 | 25.50 | 0.0 | 1.38 |
| 2026-11-03 | 26.05 | 0.0 | 0.58 |
| 2026-11-06 | 25.75 | 0.0 | 1.40 |
| 2026-11-09 | 24.34 | 0.0 | 1.40 |
| 2026-11-10 | -999 (fill) | -999 | -999 |
| 2026-11-11 | -999 (fill) | -999 | -999 |

**What this means for the sprint:**
- Dry season is real: 0.0 mm/day across the whole window (Faisalabad, November).
- **Data lags ~2 days** — latest complete day was Nov 9. The app must treat
  `-999` as missing, never plot or average it.
- Long-range queries work: a full-year daily pull for 2004 returned HTTP 200
  (366 days; mean T2M 27.46 °C; total rain 307.9 mm; 59 days > 1 mm).
  → the onset-shift computation (2004 baseline vs recent years) is feasible
  with this API alone.

**Rate/limits:** none observed; POWER is a public API. Cache responses 15 min
server-side (`/api/nasa/power`) to be polite.

---

## 2. NASA POWER Climatology API — ✅ VERIFIED LIVE, no auth

**Endpoint**

```
GET https://power.larc.nasa.gov/api/temporal/climatology/point
  ?parameters=T2M,PRECTOTCORR
  &community=AG
  &longitude=73.135&latitude=31.4504
  &format=JSON
```

**Result:** HTTP 200, API v2.10.1. 25-year monthly climatology, Jan 2001–Dec 2025.

**Sample values (real):** NOV T2M 20.06 °C, PRECTOTCORR 0.39 mm/day;
JUL T2M 35.87 °C, PRECTOTCORR 3.72 mm/day; ANN T2M 26.29 °C, ANN rain 1.17 mm/day.

**Use:** the climatology baseline for "is this month hotter/drier than normal".

---

## 3. GPM IMERG (rainfall, ~10 km) — ⚠️ NEEDS FREE EARTHDATA ACCOUNT

- GES DISC landing page reachable: `https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGDL.07/` → HTTP 200.
- Direct OPeNDAP data URL without auth produced **no response** (data download
  requires authentication).
- **Action for the sprint:** create a free NASA Earthdata account before Hour 1
  (https://urs.earthdata.nasa.gov, ~5 min, his sign-up) and use it for
  `https://gpm1.gesdisc.eosdis.nasa.gov` downloads (Basic Auth with the account).
- **Fallback (no account / auth fails):** POWER `PRECTOTCORR` for rainfall.
  It is coarser (~50 km grid vs IMERG ~10 km) — say so in the UI and in SOURCES.md.

---

## 4. SMAP soil moisture — ⚠️ NEEDS FREE EARTHDATA ACCOUNT

- Direct NSIDC file URL (SPL3SMP.008, 2026-11-09) without auth → **HTTP 000**
  (unreachable — auth wall).
- **Action for the sprint:** same Earthdata account as §3; SMAP L3 via NSIDC DAAC.
- **Fallback (no account / auth fails):** Open-Meteo `soil_moisture_0_to_1cm`
  (ERA5 reanalysis) — verified live below. Label it "ERA5 reanalysis via
  Open-Meteo", never as SMAP.
- **Rule (from the plan):** SMAP is used for CURRENT conditions only — its record
  starts 2015, so it can never support a 20-year trend claim.

---

## 5. Landsat 8–9 — ✅ COLLECTION SEARCH VERIFIED (public, no auth)

```
GET https://cmr.earthdata.nasa.gov/search/collections.json?keyword=Landsat%208&page_size=3
→ HTTP 200 — "Landsat 8-9 OLI/TIRS worldwide data products", v3.0, from 2013-02-11.
```

Granule/file download needs an Earthdata account (same as §3). For the sprint,
Landsat is a **pre-computed, honestly-badged** layer only — no live processing
pipeline in 36h.

---

## 6. ECOSTRESS — ✅ GRANULE SEARCH VERIFIED (public, no auth)

Correct short name is `ECO_L2T_LSTE` (the earlier `ECOSTRESS_L2T_STARS` does not exist).

```
GET https://cmr.earthdata.nasa.gov/search/granules.json
  ?short_name=ECO_L2T_LSTE
  &bounding_box=73.0,31.3,73.3,31.6
  &temporal=2026-10-01T00:00:00Z,2026-10-31T23:59:59Z
  &page_size=3
→ HTTP 200 — 3 hits, e.g. ECOv003_L2T_LSTE_46798_013_43RBQ_20261006T114753_01
```

Other useful ECOSTRESS collections (all public on CMR): `ECO_L4T_ESI`
(Evaporative Stress Index), `ECO_L3T_JET` (evapotranspiration). File download
needs an Earthdata account. Same sprint rule as Landsat: pre-computed + badged.

---

## 7. Fallback — Open-Meteo — ✅ VERIFIED LIVE, no key

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=31.4504&longitude=73.135
  &daily=temperature_2m_max,precipitation_sum
  &past_days=3&forecast_days=1&timezone=auto
→ HTTP 200 — Tmax 27.9 / 27.1 / 27.4 / 27.3 °C; precip 0.00 / 0.00 / 0.00 / 1.90 mm.

GET .../forecast?latitude=31.4504&longitude=73.135
  &hourly=soil_moisture_0_to_1cm,soil_temperature_0cm
  &past_days=1&forecast_days=1&timezone=auto
→ HTTP 200 — hourly soil moisture (m³/m³) + soil temperature (°C).
```

**Fallback ladder (use in this order if a NASA source fails mid-sprint):**
1. POWER daily/climatology (primary — already live, no auth).
2. Earthdata account for IMERG/SMAP/ECOSTRESS downloads (5-min sign-up).
3. Open-Meteo for temperature/precipitation/soil moisture — labelled as
   Open-Meteo/ERA5, never as NASA data.

## Verification artefacts

Raw responses from this run are in `/tmp` (ephemeral): `power_daily.json`,
`power_clim.json`, `power_2004.json`, `cmr_ecostress.json`, `cmr_landsat.json`.
Key values are copied into this file, so the sprint does not depend on `/tmp`.
