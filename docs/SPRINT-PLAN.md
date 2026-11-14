# FasalShift — 36-hour sprint plan (Nov 14–15, 2026)

**Event:** NASA Space Apps Challenge 2026, Challenge 7 — Field Shift.
**Clock:** event opens Sat Nov 14, 09:00 PT. Submission closes Sun Nov 15, 11:59 PM
(local event time — confirm against the Nov 13 Judging Guide; submit EARLY, target
Sun 12:00 PM PT).
**Timezones:** PT = UTC−8 · PKT = UTC+5 · PKT = PT + 13h.
**Realistic budget:** ~15–20h of NASA work, not 36h — Nov 14–15 also holds HackGlobal
(starts Sat 7:30 PM PT), Catalyst (Sun, 7h), FreshCheck/Hack4Hack/Code-for-a-Billion
deadlines (Sun 10:29 AM PT). The plan below is sequenced so the NASA entry is
submittable even if the weekend is cut short.

## 0. Pre-sprint checklist (Fri Nov 13 — preparation, NOT challenge work)

- [ ] Teammate named + registered for the same Universal Event (decision: Option A),
      OR Local Event route confirmed (§1.2 of the win-strategy doc).
- [ ] Read the Nov 13 Judging & Awards Guide — confirm demo format (30s video
      AND/OR 7-slide deck) and submission fields.
- [ ] Free NASA Earthdata account created (https://urs.earthdata.nasa.gov) — needed
      for IMERG/SMAP/ECOSTRESS downloads. ~5 min, his sign-up.
- [ ] This scaffold cloned/copied to a fresh repo; `npm install` smoke-tested.
- [ ] Challenge 7 resources page re-read (released Fri Nov 13).

## 1. Architecture

```
Next.js 14 + TypeScript (Vercel)
├── app/
│   ├── page.tsx            — district picker + Shift hero + rotation explorer
│   ├── api/nasa/power/route.ts — POWER proxy (15-min cache, strips -999)
│   ├── api/nasa/soil/route.ts  — SMAP current moisture (or Open-Meteo fallback)
│   └── sources/page.tsx    — SOURCES.md rendered
├── lib/
│   ├── nasa.ts             — POWER client (daily + climatology)
│   ├── shift.ts            — onset detection + trend test
│   ├── rotation.ts         — deterministic rotation scoring engine
│   └── districts.ts        — 4 districts + coordinates
├── components/
│   ├── DistrictMap.tsx     — clickable Punjab district picker
│   ├── ShiftCard.tsx       — hero number (days shifted)
│   ├── RotationCompare.tsx — 3 rotations side by side
│   └── VoiceSummary.tsx    — Urdu spoken summary (Web Speech API)
├── data/                   — district cache JSON (generated DURING sprint)
└── tests/                  — ≥20 unit tests (rotation engine + shift math)
```

**Rules:** no LLM needed; deterministic engine; every number either live from an
API or badged "pre-computed from <source>, <date>"; error states are honest
("NASA POWER unreachable — showing cached data from <time>"), never fake numbers.

## 2. Feature list (priority order — cut from the bottom, never ship broken)

| # | Feature | Must work | Notes |
|---|---|---|---|
| 1 | District picker (Faisalabad, Lahore, Multan, Layyah) | ✅ | Coordinates feed every API call |
| 2 | **The Shift** — growing-window shift in days | ✅ | POWER daily 2004 vs recent; trend + p-value shown |
| 3 | Live NASA data panel (T2M, PRECTOTCORR, WS2M — 14 days + climatology) | ✅ | Via `/api/nasa/power`; -999 handled |
| 4 | Rotation explorer — 3 rotations compared | ✅ | Wheat–Cotton / Wheat–Pulses / Wheat–Maize; scores per §ROTATION-SCORING |
| 5 | Adaptation Margin — stress test (last surviving planting day) | ✅ | The "wow" number |
| 6 | Urdu-first UX + English toggle | ✅ | Full Urdu labels |
| 7 | Urdu voice summary (Web Speech API, output only) | ✅ | No key needed |
| 8 | Soil moisture now (SMAP or Open-Meteo fallback, labelled) | ✅ | Current conditions only |
| 9 | Sources page | ✅ | Required by terms |
| 10 | Landsat/ECOSTRESS pre-computed layer | stretch | Badge honestly if live pipeline fails |
| 11 | Urdu voice INPUT | ❌ cut | Output only (not feasible in 36h) |
| 12 | Trained ML rotation model | ❌ cut | Existing wheat model + transparent rules instead |

## 3. Hour-by-hour sprint (PT; PKT in brackets)

### Saturday Nov 14 — build day

| Hours | Time (PT) | Time (PKT) | Work | Exit criteria |
|---|---|---|---|---|
| 0 | 09:00–10:00 | 22:00–23:00 | **Setup.** Repo, Vercel project, `npm install`, POWER smoke test (Faisalabad 31.45, 73.09), skeleton UI | Live POWER data on screen. **If not: STOP, re-plan to fallback (pre-computed real data, honestly labelled).** |
| 1–3 | 10:00–13:00 | 23:00–02:00 | **Data layer.** POWER daily + climatology client; onset detection; district cache generation (live calls, cached); unit tests for shift math | Onset dates computed for 2004 + 2024/2025; Shift number renders |
| 4–8 | 13:00–18:00 | 02:00–07:00 | **Engine + UI.** Rotation scoring engine; district map; comparison view; Adaptation Margin stress test; Urdu labels | All 3 rotations score; margin number renders; Urdu toggle works |
| 9–10 | 18:00–20:00 | 07:00–09:00 | **Polish.** Urdu voice summary; Sources page; mobile pass; error states; SMAP/soil layer (or labelled fallback) | Full click-through on live URL; zero page errors |
| — | 19:30 | 08:30 | ⚠️ **HackGlobal starts 7:30 PM PT** — 30-min kickoff decision (attend or skip) | — |

### Sunday Nov 15 — ship day

| Hours | Time (PT) | Time (PKT) | Work | Exit criteria |
|---|---|---|---|---|
| 11–13 | 07:00–10:00 | 20:00–23:00 | **Video + deck.** Record 30s video (live demo only); build 7-slide deck; SOURCES.md; README | Video ≤30s, deck ≤7 slides, both tell the one story |
| 14–15 | 10:00–12:00 | 23:00–01:00 | **Submit.** Deploy final; full click-through test on live URL; submit on spaceappschallenge.org; verify receipt | Submission receipt confirmed. Buffer ~12h before deadline. |
| — | 10:29 | 23:29 | ⚠️ FreshCheck + Hack4Hack + Code-for-a-Billion deadlines | — |
| — | — | — | ⚠️ **Catalyst 7h sprint also Sun Nov 15** — collision zone; NASA submit must be done by 12:00 PT | — |
| — | 11:59 PM | — | NASA submission closes (confirm exact time in Nov 13 guide) | — |

## 4. Demo video outline (30 seconds)

| Time | Shot |
|---|---|
| 0–5s | The farmer + the problem: shifted monsoon, tired soil (Urdu voiceover, English subtitles) |
| 5–15s | Click Faisalabad → live NASA data loads → "growing window shifted N days" (real computed number) |
| 15–25s | Three rotations compared → Wheat–Pulses wins on water + soil |
| 25–30s | Urdu voice summary + "Built on NASA open data" + repo link on screen |

**Rule:** record the LIVE app only. Never record a mock-up and present it as live.

## 5. Seven-slide deck structure

1. **Problem** — Punjab wheat farmer, shifted seasons, tired soil (one photo, one line)
2. **NASA data used** — POWER (temp/rain), IMERG, SMAP, Landsat/ECOSTRESS; what each feeds
3. **The Shift** — the hero number: growing window shifted N days, with trend + p-value
4. **Rotations compared** — 3 rotations, scored side by side; winner + why
5. **Adaptation Margin** — stress test: last surviving planting day
6. **Validity + limits** — what is live vs pre-computed, data lag (~2 days), SMAP record limits, no pilot users yet
7. **Team + links** — names, live URL, repo URL, sources

## 6. Submission checklist

- [ ] Open-source repo (public GitHub) — required
- [ ] SOURCES.md cites every dataset — required (disqualification risk if missing)
- [ ] Live project link (Vercel) — clickable, zero errors
- [ ] Demo: 30s video AND/OR 7-slide deck (confirm format in Nov 13 guide)
- [ ] Challenge 7 selected; team registered for the SAME event
- [ ] No pre-event challenge code (scaffold + research only — this repo complies)
- [ ] Full click-through test on the LIVE URL before submitting
- [ ] Submission receipt verified on spaceappschallenge.org
- [ ] Submit EARLY (target Sun 12:00 PM PT)

## 7. Differentiators vs known competitors (Farmyza, RotaShift, AgriTwin)

- Punjab wheat specifically (nobody else is doing Pakistani Punjab)
- Real yield model wired into rotation scoring (wheat 3.12 t/ha baseline,
  backtest MAE 0.090) instead of sample values
- Urdu-first farmer UX with voice
- Quantified Adaptation Margin from LIVE POWER data
