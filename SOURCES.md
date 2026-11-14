# Data sources

Every dataset used by FasalShift, cited per NASA Space Apps terms.
(Values are fetched live during the event; this file lists the sources, not data.)

## Primary — NASA POWER (free, no key, verified live Nov 12, 2026)

- **NASA POWER Daily Point API** — temperature at 2 m (`T2M`, °C),
  precipitation corrected (`PRECTOTCORR`, mm/day), wind speed at 2 m (`WS2M`, m/s).
  Community `AG` (agroclimatology). Source: MERRA-2 / GEOS.
  `https://power.larc.nasa.gov/api/temporal/daily/point`
- **NASA POWER Climatology API** — 25-year monthly climatology (Jan 2001–Dec 2025),
  same parameters. Used for the baseline.
  `https://power.larc.nasa.gov/api/temporal/climatology/point`

## Secondary — NASA Earth observations (metadata public; file download needs a free NASA Earthdata account)

- **GPM IMERG** (Global Precipitation Measurement, ~10 km) — rainfall onset/intensity.
  GES DISC: `https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGDL.07/`
  Requires free Earthdata login: https://urs.earthdata.nasa.gov
- **SMAP L3/L4** (Soil Moisture Active Passive) — current soil moisture (record starts 2015).
  NSIDC DAAC. Requires free Earthdata login.
- **Landsat 8–9 OLI/TIRS** — vegetation / land-surface context.
  Collection discoverable via NASA CMR (public search, no auth):
  `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=Landsat%208`
- **ECOSTRESS L2T LSTE** (land surface temperature, 70 m) — water/heat stress.
  Granules discoverable via NASA CMR (public search, no auth):
  short name `ECO_L2T_LSTE`, e.g. 3 granules over Faisalabad, Oct 2026 (verified Nov 12).

## Fallback (labelled honestly in the app whenever used)

- **Open-Meteo** (free, no key) — forecast + past-days temperature/precipitation,
  and ERA5-based soil moisture (`soil_moisture_0_to_1cm`). NOT a NASA source;
  shown as "Open-Meteo / ERA5 reanalysis" wherever it appears.
  `https://api.open-meteo.com/v1/forecast`

## Method notes (honest labelling)

- POWER daily data lags ~2 days (latest complete day at verification: Nov 9, 2026;
  Nov 10–11 returned fill value -999). The app must handle fill values, never plot them.
- SMAP is used for CURRENT conditions only — never for a 20-year trend (record too short).
- Any pre-computed district value is generated DURING the sprint from live API calls
  and cached; it is never fabricated. If a live pipeline cannot be wired in 36h,
  the value is badged "pre-computed from <source>, <date>" in the UI.
