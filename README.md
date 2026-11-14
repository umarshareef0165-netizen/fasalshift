# FasalShift — NASA Space Apps Challenge 2026

**Challenge 7: "Field Shift: Adapting Farms with NASA Data"**
**Event:** Nov 14–15, 2026 · **Team:** Umar Shareef (+ teammate TBD for Universal Event)
**Status:** PREPARATION ONLY — no challenge code has been written. The project itself
is built DURING the event (Nov 14–15), per Space Apps rules.

## Concept (one line)

A decision-support tool that tells a Punjab wheat farmer **which rotation to plant
next — and how many days their growing window has already shifted** — from live
NASA Earth observations.

## User story

"I am a wheat farmer near Faisalabad. Monsoon onset has moved, summers are hotter,
my soil is tired. What do I plant after wheat — and when — so my soil recovers and
I don't run out of water?"

## Stack

- Next.js 14 + TypeScript (same as AgriYield Advisor — no new learning)
- Vercel deploy
- Server route `/api/nasa/power` proxies NASA POWER (avoids CORS, 15-min cache)
- Deterministic rotation engine — no LLM needed
- Urdu-first UX + English toggle · Web Speech API Urdu voice summary (no key)

## District coordinates (public geographic facts)

| District | Latitude | Longitude |
|---|---|---|
| Faisalabad | 31.4504 | 73.1350 |
| Lahore | 31.5204 | 74.3587 |
| Multan | 30.1575 | 71.5249 |
| Layyah | 30.9693 | 70.9407 |

## Docs (read in order on Nov 14)

1. `STATUS.md` — what is verified, what is ready, what waits for Nov 14
2. `docs/API-VERIFICATION.md` — exact working endpoints + sample values + fallbacks
3. `docs/SPRINT-PLAN.md` — hour-by-hour 36h plan, architecture, demo, submission checklist
4. `docs/ROTATION-SCORING.md` — scoring logic on paper (pseudocode, not implemented)
5. `SOURCES.md` — every dataset cited (required by Space Apps terms)

## Folders

- `app/` — Next.js App Router (scaffold only; pages are event work)
- `lib/` — data clients + engines (empty until Nov 14)
- `components/` — UI (empty until Nov 14)
- `data/` — district cache JSON (generated DURING the sprint from live API calls)
- `tests/` — unit tests for rotation engine + shift math (event work)
- `public/` — static assets
- `docs/` — preparation docs (this folder)

## Hour 0 checkpoint (Sat Nov 14, 09:00 PT)

`npm install` → `npm run dev` → POWER API smoke test for Faisalabad.
**If live POWER data is not on screen within 60 minutes, STOP and re-plan**
(fallback: pre-computed real data from the verification run, honestly labelled).
