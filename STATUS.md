# STATUS — FasalShift preparation (NASA Space Apps 2026, Challenge 7)

**Updated:** Sat Nov 14, 2026, ~09:35 PT (sprint build DONE — deploy + push pending)

## ✅ SPRINT BUILD COMPLETE (Nov 14, ~09:35 PT)

- **Tests: 31/31 passing** (13 shift + 18 rotation); `tsc` clean; `next build` clean; local commit `7b3b1ba`.
- **Live verification:** `/` HTTP 200 (Faisalabad, shift +2, "not statistically significant" in SSR HTML), `/sources` HTTP 200, `/api/nasa/power` live proxy returns real POWER data, `/api/nasa/soil` returns 0.178 m³/m³ (ERA5, labelled NOT SMAP).
- **Live cache** `data/districts.json` (101 KB, 54/54 POWER calls HTTP 200, zero failures; generated 17:28 UTC).
- **Faisalabad hero numbers (live NASA POWER):** onset +2 days (2004 Jun 16 → recent median Jun 18); trend −0.54 days/yr, p = 0.12 — NOT significant; GDD 2,416 → 2,681; grain-fill heat days 0 → 5; soil 0.156 m³/m³; 2025 monsoon 5.02 vs 2.37 mm/day climatology = 2.12×.
- **Rotations (Faisalabad):** Pulses 7.4 ★, Cotton 6.8, Maize 6.5. **Adaptation Margin:** Faisalabad 2 days (all), Multan 8, Layyah 3, Lahore 2.
- **Honesty fix found + fixed in-sprint:** 2004-05 grain fill genuinely had 0 heat days (verified live: max 27.89 °C Mar–Apr 2005), so the raw heat-pressure ratio was undefined — capped at 2.0× (labelled rule, shown in UI + spec). Water display now shows the true ratio (2.12×) while scoring uses the clamped 2.0.
- **Deck:** `docs/deck.html` (7 slides, presentable in browser, real numbers). **Demo script:** `docs/DEMO-SCRIPT.md` (30s, shot-by-shot; recording is his step). **Submission draft:** `docs/SUBMISSION-DRAFT.md` (paste-ready; URL placeholders pending).

## ⛔ BLOCKED — needs parent/user (not solvable from this VM)

- **Vercel deploy:** the `vercel` binary here is the MCP server wrapper and reports `not_connected`; no stored token, no CLI login. Deploy needs either the Vercel MCP connected (authorize-url), a Vercel token, or a dashboard import.
- **GitHub push:** `gh` auth is user-only; repo is a local git repo only (commit `7b3b1ba`). The Vercel dashboard import needs the repo public first.
- **30s video recording:** his step, on the live URL only.
- **Earthdata login:** still pending (his-only); IMERG/SMAP not used — fallbacks labelled.
- **Submission:** draft ready; needs his final approval + the live URL + repo URL.

## ✅ VERIFIED LIVE (from this VM, Nov 12)

| Item | Evidence |
|---|---|
| NASA POWER Daily Point API (T2M, PRECTOTCORR, WS2M) | HTTP 200, v2.10.3, Faisalabad real values (T2M 24–26.5 °C, rain 0.0 mm/day, Nov 1–9) |
| POWER data lag ~2 days | Nov 10–11 returned fill value -999 — app must skip -999 |
| POWER long-range daily queries | Full 2004 year: HTTP 200, 366 days, mean T2M 27.46 °C, 307.9 mm rain — onset-shift math feasible |
| NASA POWER Climatology API | HTTP 200, v2.10.1, 25-yr baseline (2001–2025); NOV T2M 20.06 °C, rain 0.39 mm/day |
| NASA CMR — Landsat 8–9 collection search | HTTP 200, public, no auth |
| NASA CMR — ECOSTRESS granules (`ECO_L2T_LSTE`) | HTTP 200, 3 hits over Faisalabad, Oct 2026 (correct short name found) |
| Open-Meteo fallback (temp/precip/soil moisture) | HTTP 200, no key |
| GES DISC landing page reachable | HTTP 200 (data download still needs auth — see below) |

## ⚠️ NEEDS AN EARTHDATA ACCOUNT (his 5-min sign-up, before Hour 1)

| Item | Status |
|---|---|
| GPM IMERG data download | Direct OPeNDAP URL without auth: no response — needs free Earthdata login |
| SMAP soil-moisture download | NSIDC direct URL without auth: HTTP 000 — needs free Earthdata login |
| ECOSTRESS / Landsat file download | CMR metadata is public; files need Earthdata login |
| Fallback if no account | POWER PRECTOTCORR (rain) + Open-Meteo soil moisture (ERA5, labelled) |

## ✅ READY (in this folder)

- Repo scaffold: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`
- `README.md` (plan + Hour 0 checkpoint), `SOURCES.md` (all datasets cited)
- `docs/API-VERIFICATION.md` (exact endpoints + sample values + fallbacks)
- `docs/SPRINT-PLAN.md` (hour-by-hour 36h plan, architecture, demo, checklist)
- `docs/ROTATION-SCORING.md` (pseudocode + exact NASA variables — NOT implemented)
- Folder structure: `app/`, `lib/`, `components/`, `data/`, `tests/`, `public/`, `docs/`

## ⏳ MUST WAIT FOR NOV 14 (event work — NOT done now, per Space Apps rules)

- Any feature code, UI, or data logic
- `npm install` + dev-server smoke test (Hour 0)
- POWER smoke test on the live app (Hour 0 checkpoint)
- District cache generation from live API calls (Hours 1–3)
- Rotation engine + shift math implementation + unit tests
- Vercel deploy, 30s video, 7-slide deck, submission

## ⏳ DECISIONS STILL OPEN (his-only, before Nov 14)

- **Teammate:** ✅ RESOLVED Nov 14 ~04:48 PT — Naveed Ahmad (naveedahmad_cs) join request APPROVED by Umar as team owner; team FasalShift now 2 members, Universal Event, Global Judging ELIGIBLE.
- **Nov 13 Judging Guide:** demo = 7 slides OR ≤30s video, English, ≥1 NASA data/resource required for Global Awards; submission closes Sun Nov 15, 11:59 PM ET.
- **Weekend collision:** NASA + HackGlobal + Catalyst all Nov 14–15 — sequencing
  call is his (see win-strategy doc §3).

## Compliance note

No challenge-specific code exists in this folder. Only research, verified API
checks, planning docs, and an empty scaffold — all allowed before the event.
