# FasalShift — submission draft (paste-ready)

**Status:** DRAFT — do NOT submit yet. Live URL is LIVE (verified Nov 14 ~10:26 PT); repo CREATED public Nov 14 ~10:42 PT, files uploading (verify before submit).
Submission closes **Sun Nov 15, 11:59 PM ET**. Target: submit Sun 12:00 PM PT.
Team: FasalShift (Umar Shareef + Naveed Ahmad), Universal Event,
Global Judging eligible. Challenge 7: Field Shift.

## Space Apps submission fields

**Project title:** FasalShift — Which rotation should a Punjab farmer plant next?

**Challenge:** Field Shift: Adapting Farms with NASA Data (Challenge 7)

**Project summary (short):**
FasalShift tells a Punjab wheat farmer which rotation to plant next — and how
many days their growing window has already shifted — from live NASA Earth
observations. It measures the monsoon-onset shift from 22 years of NASA POWER
daily data (Faisalabad: +2 days since 2004), scores three rotations
(Wheat→Pulses wins at 7.4/10), and stress-tests each one to find the last safe
planting day (Faisalabad: 2 days of slip). Urdu-first, with a spoken Urdu
summary. Every number is live from NASA POWER or a labelled rule — nothing
invented, no pilot users yet (stated in the app).

**Live project link:** https://fasalshift.vercel.app/ (verified live Nov 14 ~10:26 PT: homepage 200, /sources 200, /api/nasa/power returns live NASA POWER data)

**Open-source repo:** https://github.com/umarshareef0165-netizen/fasalshift (public, created Nov 14 ~10:42 PT)

**Demo:** 7-slide deck (`docs/deck.html`, presentable in a browser / print to PDF)
AND 30-second video (script in `docs/DEMO-SCRIPT.md`; recording is the user's
step, on the live URL only).

**Data sources used (must match SOURCES.md):**
- NASA POWER Daily Point API (T2M, PRECTOTCORR, WS2M; community AG) — live, no key
- NASA POWER Climatology API (25-yr monthly baseline, 2001–2025) — live, no key
- NASA CMR metadata: Landsat 8–9 collections + ECOSTRESS ECO_L2T_LSTE granules
  (discovery only; file downloads need an Earthdata login — not wired)
- Open-Meteo archive (ERA5 soil moisture) — fallback only, labelled "NOT SMAP"
- GPM IMERG / SMAP: NOT used (Earthdata login unavailable during the sprint);
  POWER rain + Open-Meteo soil used instead, labelled in the app and deck.

**What we built (for the "project description" box):**
Next.js 14 + TypeScript app. A deterministic rotation engine (no LLM): monsoon
onset detection (3-day ≥ 7.5 mm rule), OLS trend test, growing-degree-day and
grain-fill heat-day math, 4-dimension rotation scoring (water 35%, soil 25%,
heat 25%, margin 15%), and an Adaptation Margin stress test that slides the
planting window over the real 2024-25 daily series. Urdu-first UI with English
toggle and a Web Speech API Urdu voice summary. Live data proxied through
`/api/nasa/power` (15-min cache, −999 fill values stripped, never averaged).
Sources page cites every dataset.

**Results (verified, Sat Nov 14, 2026):**
- 31/31 unit tests passing (rotation engine + shift math); `tsc` clean; `next build` clean.
- Faisalabad: onset +2 days (2004 Jun 16 → recent median Jun 18); trend
  −0.54 days/yr, p = 0.12 — NOT statistically significant (reported honestly).
- GDD 2,416 → 2,681; grain-fill heat days 0 → 5.
- Rotations (Faisalabad): Pulses 7.4 ★, Cotton 6.8, Maize 6.5.
- Adaptation Margin: Faisalabad 2 days (all rotations); Multan 8; Layyah 3; Lahore 2.
- 2025 monsoon: 5.02 mm/day vs 2.37 climatology = 2.12× (wet year).

**Limits (stated in the app + deck, do not hide):**
- Onset trend not significant (p = 0.12); headline is the +2-day median shift.
- Soil moisture is ERA5 reanalysis, not SMAP; rain is POWER (~50 km), not IMERG.
- No Landsat/ECOSTRESS processing pipeline (metadata only); no ML rotation model.
- No pilot users yet; no farmer field validation.
- POWER data lags ~2 days; newest days show as "not yet published".

## Pre-submit checklist

- [ ] Repo pushed to public GitHub (user-only) — replace repo placeholder above
- [x] Vercel deploy live + verified with curl in a logged-out check — https://fasalshift.vercel.app/ (Nov 14 ~10:26 PT)
- [ ] Full click-through on the LIVE URL (all 4 districts, toggle Urdu, voice summary, /sources)
- [ ] 30s video recorded on the live URL (≤ 30 s) OR deck attached (deck ready: `docs/deck.html`)
- [ ] Challenge 7 selected; team registered for the same Universal Event (done)
- [ ] SOURCES.md present in repo + /sources page live
- [ ] Submit, then verify the receipt on spaceappschallenge.org
