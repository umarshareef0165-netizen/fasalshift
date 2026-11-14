# FasalShift — WIN STRATEGY (NASA Space Apps 2026, Challenge 7 'Field Shift')

**Written:** Sat Nov 14, 2026, ~10:40 PT · **Author:** Win Strategy writer (subagent)
**Status of the build this judges:** app LIVE at https://fasalshift.vercel.app/
(verified Nov 14 ~10:26 PT), tests 31/31, `tsc` + `next build` clean.
**Team:** FasalShift — Umar Shareef + Naveed Ahmad, Universal Event, Global Judging eligible.
**Deadline:** submission closes **Sun Nov 15, 11:59 PM ET** (working deadline — see §6);
target submit **Sun 12:00 PM PT** (≈ 9 h buffer).

**Read before acting:** `STATUS.md`, `docs/SPRINT-PLAN.md`, `docs/SUBMISSION-DRAFT.md`,
`docs/DEMO-SCRIPT.md`, `docs/deck.html`, `SOURCES.md`, `docs/API-VERIFICATION.md`,
`docs/ROTATION-SCORING.md`, `app/page.tsx`, `components/Planner.tsx`,
`lib/rotation.ts`, `lib/shift.ts`, plus `data/districts.json` (live cache, 54/54 POWER calls).

---

## 0. What this document corrects in the brief

Two corrections to the assumptions handed to this writer — both verified against
official sources (§1) on Nov 14:

1. **There are NO published numeric weights for 2026.** Each criterion is scored
   1–5 at every judging level, and the working assumption is *roughly equal* weight
   (the 2025 carry-over is 20% each — see the CrafterWiki recon, which states
   explicitly: *"Equal weights are an assumption: no percentages are published"*).
   Do **not** present "20% each" as an official 2026 fact anywhere in the submission.
   A Costa Rica local-event article publishes a 30/20/20/20/10 grid — that is a
   **local variant, not the official global rubric**. Ignore it.
2. **The Nov 13 official guides exist but their full text could not be fetched
   from this VM.** The official 2026 YouTube explainer confirms the Project
   Submission Guide and the Judging & Awards Guide were published Nov 13 and that
   judging starts at 10:48 in the video — but the guide URLs in the video
   description were truncated in the fetch, and `spaceappschallenge.org/resources/`
   pages returned stale/empty crawls. The criterion definitions below are
   nevertheless **verbatim from NASA's official judging PDF** (assets domain),
   which states the same criteria are used for Universal Event, Global and
   Executive judging — so the rubric itself is confirmed, even though the
   Nov 13 guide's full text is not in hand. **Action before submitting:** open the
   Judging & Awards Guide link from the video description / resources index on a
   live browser and re-check §1 (one 5-minute check; parent agent owns it).

---

## 1. Judging criteria — official table

| # | Criterion | Weight (official) | What judges look for (official wording, paraphrased only where noted) | Official source |
|---|---|---|---|---|
| 1 | **Impact** | No % published — scored 1–5, treated as roughly equal with the other four | *"How much impact (quality and quantity) can this project have? Does it address a big problem or a little problem? Will it inspire or help many, or a few?"* (verbatim) | NASA, *Instructional Guidance for Judging — Local Judging* (PDF, assets.spaceappschallenge.org): https://assets.spaceappschallenge.org/media/documents/WEB_PDF_Instructional_Guidance_for_Judging__-_Local_Judging_WPqgn1r.pdf — also mirrored at https://www.spaceappsulaanbaatar.com/judging |
| 2 | **Creativity** | Same — 1–5, no % published | *"How creative/innovative is the approach? Is the project novel and something that hasn't been attempted before, or is it an incremental improvement on something that already exists?"* (verbatim) | Same PDF + mirror above |
| 3 | **Validity** | Same — 1–5, no % published | *"Is the proposed solution scientifically valid? Will it do what it sets out to do? Can it work in the real world?"* (verbatim) | Same PDF + mirror above |
| 4 | **Relevance** | Same — 1–5, no % published | *"Is this project responsive to the challenge for which it was submitted? Is it a complete project or does it have a long way to go? Is it technically feasible? How usable or user friendly is the proposed solution?"* (verbatim) | Same PDF + mirror above |
| 5 | **Presentation** | Same — 1–5, no % published | *"How well did the team communicate their project? Were they effective in telling the story of the project: the challenge, the proposed solution, and why is it important?"* (verbatim) | Same PDF + mirror above |

### Judging funnel (confirmed)

Three phases, same five criteria at each phase (per the official judging PDF:
*"This criteria is the same that is used for Universal Event, Global and
Executive Judging"*):

| Phase | Who judges | Output | Team present? |
|---|---|---|---|
| 1 | Universal Event judges | Global Nominees (≈ 1 in 10 projects, per the 2024 guide) | Depends on format — Universal Event is virtual; assume **no live pitch**: the submission page carries the project |
| 2 | NASA + Space Agency Partner subject-matter experts | Global Finalists + Honorable Mentions (announced Dec 2026, per secondary timeline) | No — they review the submission page only |
| 3 | Executive committee of agency leaders | 10 Global Awards (announced Jan 2027, per secondary timeline) | No — submission page only |

**Consequence that drives everything in §3:** phases 2 and 3 never meet the team.
The project page, the demo link and the live app link **are** the pitch. A dead
link or a placeholder in phase 1 is not a small deduction — it is the whole pitch
failing in phases 2–3.

### Gates (pass/fail, not scored)

- **NASA data use is mandatory for Global Awards.** FasalShift qualifies: live
  NASA POWER daily + climatology. "Choose Your Own Challenge" projects are not
  eligible — not applicable (Challenge 7 selected).
- **Demo: 7-slide deck OR ≤ 30-second video**, public link, no login/password.
  (Confirmed by the Ulaanbaatar official local page and the 2026 submission
  walkthrough; demo must be in English or subtitled in English.)
- **Open-source repo, public.** Required as the "Final project" link.
- **Project page in English; AI use disclosed; sources listed; no NASA branding.**
  (Per the 2026 submission walkthrough summary and prior-year rules carried into
  2026 — re-verify against the Nov 13 Submission Guide in the same 5-minute
  check as §0.2.)
- **Submission window:** opens Sat Nov 14, 9:00 AM local time; closes
  Sun Nov 15, 11:59 PM **in the timezone of the Team Owner's Local Event**
  (official 2026 video). For the Universal Event the working deadline used by
  this team is 11:59 PM ET — confirm the exact timezone shown on the team's
  project page before Sun noon; the 12:00 PM PT target leaves ~9 h of buffer
  either way.

### Sources used for this section

- Official judging PDF (verbatim criteria + three-phase sameness):
  https://assets.spaceappschallenge.org/media/documents/WEB_PDF_Instructional_Guidance_for_Judging__-_Local_Judging_WPqgn1r.pdf
- Official local-event mirror of the criteria + demo format + NASA-data gate:
  https://www.spaceappsulaanbaatar.com/judging
- Official 2026 video, *Project Submission and Judging & Awards* (guides exist,
  window, Judging & Awards at 10:48): https://www.youtube.com/watch?v=CV7AYfMRyMM
- Official participant FAQ / 2026 event page (via recon citations):
  https://www.spaceappschallenge.org/resources/participant-faqs/ and
  https://www.spaceappschallenge.org/2026/
- Secondary recon (weights assumption, funnel shape, Dec/Jan announcement
  timeline — **flagged as secondary, not official**):
  https://github.com/rikepilb/crafterwiki/blob/HEAD/hack-plan/nasa-space-apps-2026/01-recon.md
  and https://www.crafterwiki.com/events/nasa-space-apps-2026/
- NOT used (local variant, not the global rubric): the Costa Rica 30/20/20/20/10
  grid — https://thecostaricanews.com/nasa-space-apps-challenge-opens-call-in-costa-rica-for-participants-without-prior-tech-experience/

---

## 2. Honest current standing per criterion (1–5, no inflation)

Scored as the submission stands **right now** (Sat ~10:40 PT): live app done,
deck drafted, video unrecorded, repo not yet public.

| Criterion | Score | Evidence FOR | Evidence AGAINST (the honest drag) |
|---|---|---|---|
| **Impact** | **4 / 5** | Real, large problem: Punjab wheat farmers planting blind as monsoon onset moves and grain-fill heat rises. Decision is concrete (which rotation, how late can planting slip) and the user is the farmer, not a dashboard hobbyist. Urdu-first + voice summary reaches low-literacy users — the actual affected population. 4 districts covered, not one demo town. | **No pilot users, no farmer validation, no quantified reach.** "Millions of Punjab farmers" is a population, not evidence anyone will use this. No adoption path (extension service? SMS? agri-app?) is named anywhere. Impact 5 needs at least one named channel to farmers or one pilot farmer. |
| **Creativity** | **3 / 5** | The **Adaptation Margin** stress test ("last safe planting day", computed by sliding the window over the real 2024–25 daily series) is genuinely distinctive — it reframes the challenge from "show the shift" to "give the farmer a deadline". Urdu-first UX + spoken Urdu summary is rare in this field. The +2-day shift + heat-days story is a real, local finding, not a generic climate slide. | The rotation engine is **transparent rules, not a new method** — water/soil/heat/margin constants are labelled agronomic rules, and the deck says so honestly. Agri-rotation advisors exist; nothing here is a novel algorithm or a novel dataset combination. Creativity 4 would need one more original move (see §3 nice-to-haves). |
| **Validity** | **3 / 5 — WEAKEST** | Strongest evidence habits in the build: 22 years of live NASA POWER daily data; onset rule stated and reproducible (3-day ≥ 7.5 mm after Jun 1); OLS trend with a real p-value reported; −999 fill values skipped, never averaged; 31/31 unit tests; fallbacks labelled (ERA5 ≠ SMAP, POWER rain ≠ IMERG); wheat baseline 3.12 t/ha is a verified model with backtest MAE 0.090. | Three substantive holes (see §3): **(a)** the hero effect is small and **not significant** — Faisalabad onset +2 days, trend −0.54 days/yr, **p = 0.12**; **(b)** the **water dimension is dead in the hero district** — all three rotations score Water **10.0** in Faisalabad because the 2025 wet year (2.12× climatology) saturates the formula, so the winner is decided by soil + heat + margin *rules*, not by data; **(c)** the non-Faisalabad trend lines rest on **n = 4 years** (Lahore/Multan/Layyah onsets found in only 4 of 22 years — see `data/districts.json`), so the deck's "Lahore +12 days" line is thin. A validity-focused SME judge will find all three. |
| **Relevance** | **5 / 5** | Direct, complete answer to Challenge 7 ("Field Shift: Adapting Farms with NASA Data"): measures the field shift from NASA data, then adapts the farm decision (rotation + planting deadline) from the same data. Uses NASA POWER live, not decoratively. Complete working project: 4 districts, live 14-day panel, sources page, Urdu toggle. Nothing off-brief. | Nothing material. The only relevance-adjacent gap is the missing Landsat/ECOSTRESS layer promised in Sprint Plan §2 item 10 — but that was a stretch goal, and the challenge does not require it. |
| **Presentation** | **3 / 5** | Deck exists (7 slides, real numbers, honest limits slide), demo script exists (30 s, shot-by-shot, numbers locked to the live cache), submission draft is paste-ready, app UI is clean and the hero number renders in SSR HTML. The story is tellable in one line (§4). | **Joint-lowest with Validity — but the most fixable.** Video is **not recorded**; deck slide 7 still has **[VERCEL URL — pending deploy]** and **[GITHUB URL — pending push]** placeholders even though the live URL is known; repo is **not public yet**; deck is an HTML file in `docs/`, not yet a public link judges can open. As it stands today, phases 2–3 would receive a submission with placeholder links. |

**Overall (equal-weight working assumption): 18 / 25.**
**Weakest criterion: Validity (3/5)** — not because the work is sloppy (its honesty
habits are the best part of the entry) but because the *substance* a validity judge
probes — effect size, discriminating scoring, multi-district robustness — is where
the real gaps are, and they cannot all be fixed by polish. Presentation is also 3/5
but is fixable in under an hour; Validity is the binding constraint on a Global
Award. **Best award-lane fit on current strengths: Best Use of Data** (live POWER
pipeline, reproducible method, honest labelling) or **Local Impact / Galactic
Impact** (farmer decision in Punjab). Do not chase Best Use of Science — the
non-significant trend and rule-based scoring cannot carry it.

---

## 3. Prioritised upgrade list

Rules for every item: **real data only** (live NASA POWER, or labelled
Open-Meteo/ERA5 fallback); **never invent a number**; keep the honest limits
visible (p = 0.12 not significant; ERA5 ≠ SMAP; no pilot users; water cap;
n = 4 trends). No item below changes the headline numbers unless stated —
and where it does, the deck + submission draft + tests must be updated together.

### MUST-HAVE — needed to win, or to not lose points (do in this order)

**M1. Make the submission package submittable: public repo + real links everywhere.**
- *Why:* phases 2–3 judge the links, not the team. A private repo or a
  placeholder link is a failed pitch, not a deduction.
- *Files:* GitHub push (his-only `gh` auth — repo is local-only, commit `7b3b1ba`
  plus sprint work); then replace placeholders in `docs/deck.html` slide 7,
  `docs/SUBMISSION-DRAFT.md` ("Open-source repo" field), `docs/DEMO-SCRIPT.md`
  (end card), and the submission form itself. Repo must contain `SOURCES.md`,
  `README.md`, `data/districts.json` (or a note on how it was generated), and the
  `docs/` folder.
- *Data:* no new data. *Verify:* open the repo URL logged-out; open the live
  Vercel URL logged-out (Deployment Protection already OFF, verified ~10:26 PT —
  re-verify once after any redeploy).

**M2. Record the 30-second video on the live URL (or, failing that, ship the deck
alone — never ship neither).**
- *Why:* demo is 7 slides **OR** ≤ 30 s video. The deck alone is legal, but a
  video is the only format where a judge *sees* the app working; and if the deck
  link breaks, the video is the backup. Both is best; either is acceptable.
- *Files:* follow `docs/DEMO-SCRIPT.md` exactly (see §5 for the two script edits);
  record on https://fasalshift.vercel.app/ only; upload to YouTube (unlisted is
  fine — must be publicly playable, no login) and put that link in the submission
  form's demo field.
- *Data:* numbers already locked in the script (§5). *Verify:* timer ≤ 30 s,
  English subtitles present (Urdu voiceover), end card shows live URL + repo URL.

**M3. Fix the dead water dimension — or, minimum, label it honestly.**
- *Why:* the single biggest validity hole a judge can spot in 10 seconds:
  deck slide 4 shows Water **10.0 / 10.0 / 10.0**. One of four scoring dimensions
  does not discriminate at all in the hero district, because the 2025 wet year
  (2.12× climatology, clamped to 2.0 for scoring) saturates the formula
  (`lib/rotation.ts`: `water = clamp(10 − need × (1.2 − waterAvailable))`).
  The winner is therefore decided by rules, not data, in exactly the district
  the story leads with.
- *Strong fix (preferred if one dev-hour is free):* cap `waterAvailable` at **1.0**
  for scoring (surplus rain above climatology is surplus — it cannot make a
  thirsty crop thirstier to differentiate). In `lib/rotation.ts`, clamp the
  scoring input to [0, 1.0] (keep the *displayed* ratio at the true 2.12× —
  `components/Planner.tsx` already separates `waterRatio` for display from
  `waterAvailable` for scoring). Recomputed Faisalabad scores with the cap:
  Pulses **7.2** (water 9.4), Cotton **6.2** (water 8.2), Maize **6.0**
  (water 8.6) — **winner unchanged (Pulses still wins), gap widens, water
  discriminates.** Then update `tests/` (rotation tests must be re-run: 31/31
  must stay green), `docs/deck.html` slide 4 table, `docs/SUBMISSION-DRAFT.md`
  results, and `docs/ROTATION-SCORING.md` (record the cap as a labelled rule
  with its reason, exactly like the 2.0× heat cap precedent).
- *Minimum fix (15 min, docs-only, if no dev-hour):* keep the scores, but add one
  honest line to deck slide 4 and to the app's weights note
  (`components/Planner.tsx`, `weightsNote` string): *"Water 10.0 for all three —
  2025 was a wet year (2.12× climatology), so water does not decide this year;
  the winner is decided by soil + heat + margin."* Never let a judge discover
  the 10/10/10 themselves.
- *Data:* real — uses the existing live 2.12× ratio. No invented numbers.

**M4. Verify or drop the Lahore +12 line (and the Multan/Layyah trend claims).**
- *Why:* `data/districts.json` shows Faisalabad's trend on **n = 22** years
  (p = 0.12) but Lahore, Multan and Layyah trends on **n = 4** years
  (p = 0.62 / 0.62 / 0.66). Only 4 of 22 years produced a qualifying onset for
  those districts under the 3-day ≥ 7.5 mm rule. The deck slide 3 line
  "Lahore +12 days, Multan −5, Layyah −4" is a *median* shift (2004 vs
  2023–2025 median), which is still real data — but a judge who opens the cache
  or asks about the trend will find n = 4.
- *Files:* `docs/deck.html` slide 3; `docs/SUBMISSION-DRAFT.md` (do not add
  multi-district trend claims there).
- *Action (30 min):* check *why* only 4 onsets were found for the other
  districts (likely: onset rule rarely triggers, or cache generation only stored
  recent + 2004 years for them — check the generation script / `lib/nasa.ts`
  before asserting a cause). If it is a generation gap, regenerate the full
  2004–2025 onset series for all four districts from live POWER and re-check n.
  If it is real (onsets genuinely rare under the rule), **drop the Lahore +12
  line from the deck** and lead only with Faisalabad (n = 22), adding one line:
  *"Other districts: onset series too sparse under the 7.5 mm rule to report a
  trend — Faisalabad is the verified district."* Honesty here *gains* validity
  points; a thin +12 *loses* them.
- *Data:* live POWER only. Do not fill the gap with any other source.
- **M4 outcome (Nov 14, ~10:45 PT — DONE, generation gap confirmed):** it was
  the cache script, not the data. `scripts/fetch-cache.mjs` only fetched
  2004 + 2023/24/25 for Lahore/Multan/Layyah. Regenerated the full 2004–2025
  onset series for all three from live NASA POWER
  (`scripts/regen-onsets.mjs`, one daily-point call per district for the
  whole range, 7,792 days each) and rebuilt `data/districts.json` (Faisalabad
  left untouched). **All four districts now n = 22** — onsets trigger every
  year under the 3-day ≥ 7.5 mm rule. **Median shifts UNCHANGED: Lahore +12,
  Multan −5, Layyah −4 — deck slide 3 line KEPT as written.** New n = 22
  trends: Lahore −0.17 days/yr, p = 0.62 (not significant); Multan −1.76
  days/yr, p = 0.004 — **statistically significant** (onset earlier);
  Layyah −0.58 days/yr, p = 0.07 (not significant). Consequence: the app's
  "Honest limits" line in `components/Planner.tsx` now shows significance
  per district instead of always saying "not significant" (Multan correctly
  shows p < 0.01, statistically significant); `ShiftCard.tsx` already gated
  the warning on p < 0.05. The Multan finding is recorded in
  `docs/SUBMISSION-DRAFT.md` Results; the deck does not claim it.

**M5. Fill the submission form completely and honestly — including the fields
teams forget.**
- *Why:* the form *is* the phase-2/3 pitch. Empty or vague fields read as an
  incomplete project (Relevance explicitly asks "is it a complete project?").
- *Files:* `docs/SUBMISSION-DRAFT.md` is the source — complete it, don't
  improvise on the form. Checklist:
  - High-level summary = §4 one-line value + hero numbers (paste-ready in the draft).
  - Project Details: method (onset rule, OLS + p-value, GDD/heat math, 4-dimension
    weights, Adaptation Margin procedure), tools (Next.js 14 + TypeScript, NASA
    POWER API, Open-Meteo fallback), goals.
  - **Use of AI / NASA data:** disclose AI use explicitly (deterministic engine,
    no LLM in the product; AI-assisted coding during the sprint — state what was
    used, per the submission guide's disclosure requirement; never leave this
    blank). List every NASA resource: POWER Daily, POWER Climatology, CMR
    metadata (Landsat 8–9, ECOSTRESS ECO_L2T_LSTE).
  - **Sources/references:** paste the `SOURCES.md` list (every dataset cited —
    a missing citation is a disqualification risk per the sprint plan).
  - **Limits paragraph:** keep the draft's Limits block verbatim (p = 0.12,
    ERA5 ≠ SMAP, POWER rain ≠ IMERG, no Landsat/ECOSTRESS pipeline, no ML model,
    no pilot users, ~2-day POWER lag). Do not soften it on the form.
  - Challenge 7 selected; both members listed for the same Universal Event.
  - Verify the receipt on spaceappschallenge.org after submitting (screenshot it).
- *Data:* none new. *Verify:* full click-through on the live URL first — all 4
  districts, Urdu toggle, voice summary button, `/sources` page — in a logged-out
  browser.

**M6. Reframe the hero story around the significant signal (deck + script wording
only, no code).**
- *Why:* the onset shift (+2 days, p = 0.12) is the *smallest* true claim in the
  project and the one a judge can most easily dismiss. The *warming* signal in
  the same data is large and unambiguous: grain-fill heat days **0 → 5**,
  GDD **2,416 → 2,681** (+265). The story should lead with the shift as the
  *farmer's question* and land on heat as the *proof the climate moved*.
- *Files:* `docs/deck.html` slide 3 (add one line under the hero: *"The shift is
  small — but the heat is not: grain-fill heat days 0 → 5, GDD +265. That is the
  warming signal inside the same 22 years."*); `docs/DEMO-SCRIPT.md` 5–15 s
  voiceover (see §5); `docs/SUBMISSION-DRAFT.md` summary (already balanced —
  keep as is).
- *Data:* real, already computed. Never phrase the trend as a finding:
  always *"trend −0.54 days/yr, p = 0.12 — not statistically significant"*.

### NICE-TO-HAVE — do only after M1–M6 are done, and never at the cost of the 12:00 PM PT target

**N1. One more live NASA dataset, wired small: latest Landsat/ECOSTRESS granule
date from CMR (public, no auth).**
- *Why:* strengthens Validity + Best Use of Data lane; answers "only one NASA
  source?" (currently POWER only, live).
- *Files:* new tiny fetch in `app/api/nasa/cmr/route.ts` (CMR granule search,
  already verified: ECOSTRESS `ECO_L2T_LSTE`, 3 hits over Faisalabad Oct 2026;
  HLS granule Oct 4, 2026) + one line on `/sources` or a "Satellite context"
  card in `components/Planner.tsx` ("Latest Landsat 8–9 HLS granule over
  Faisalabad: Oct 4, 2026 — metadata only, no processing pipeline").
- *Data:* live CMR metadata only. Effort ~45 min. **Do not** attempt file
  downloads (needs Earthdata login — his-only, out of reach in the remaining
  hours).

**N2. All-district Adaptation Margin table on deck slide 5.**
- *Why:* Multan 8 days vs Faisalabad 2 is the most surprising contrast in the
  project and it is currently buried in the draft. One table row set, zero new data.
- *Files:* `docs/deck.html` slide 5 (add: Multan 8, Layyah 3, Lahore 2 — all
  already computed). Effort 10 min.

**N3. A static Punjab district map in the picker.**
- *Why:* the sprint plan promised a clickable map (`DistrictMap.tsx`); the app
  ships buttons (`components/DistrictPicker.tsx`). A simple labelled SVG of the
  four districts would lift Presentation and make the video's first click visual.
- *Files:* new `components/DistrictMap.tsx` + `components/Planner.tsx` wiring.
  Effort ~1 h. Cut first if the clock slips — buttons work fine.

**N4. Name one adoption channel (one sentence, no new build).**
- *Why:* the only thing standing between Impact 4 and 5. One honest sentence in
  the submission ("Next step: pilot with [named] Punjab extension service /
  farmer group — no contact yet") is better than a vague "farmers will use it".
  Do **not** name an organisation unless contact is real — an unnamed channel
  ("via Punjab agriculture extension SMS networks, to be piloted") is honest.
- *Files:* `docs/SUBMISSION-DRAFT.md` only. Effort 5 min.

**N5. Do NOT chase (explicitly out of scope for the remaining hours):**
Earthdata login → IMERG/SMAP wiring; a trained ML rotation model; a pilot
farmer; Urdu voice *input*. Each is real work that cannot be done honestly
before the deadline, and chasing any of them risks M1/M2/M5. The labelled
fallbacks are the correct answer, not a failure.

---

## 4. The 30-second judge narrative

**One-line value (use verbatim everywhere — form summary, deck slide 1, video
first frame, repo README):**

> **FasalShift tells a Punjab wheat farmer which rotation to plant next — from
> 22 years of live NASA data — and how many days late they can still plant.**

| Time | What the judge sees | What the judge learns | Where it lives |
|---|---|---|---|
| **First 5 s** | App open on Faisalabad. Hero number: **+2 days**. One line: *"Faisalabad's monsoon moved 2 days later since 2004."* | A real place, a real measured shift, a real question (what to plant, when). Not a generic climate dashboard. | Deck slide 1 + 3; video 0–5 s; app hero (`components/ShiftCard.tsx`) |
| **15 s** | Click Faisalabad → live NASA POWER panel loads → three rotations side by side → **Wheat → Pulses 7.4 ★ Recommended** (Cotton 6.8, Maize 6.5), with the four dimension bars visible. | The app *does* something with the data: it answers the question, shows its working, and the winner is traceable to water/soil/heat/margin — not a black box. | Deck slide 4; video 5–15 s; `components/RotationCompare.tsx` |
| **30 s** | Adaptation Margin: **"still works if planting slips 2 days"** → heat proof (**0 → 5** heat days) → Urdu voice summary speaks → end card: *"Built on NASA open data"* + live URL + repo. | The memorable number (a deadline, not a chart), the honest warming signal, the farmer actually being served (Urdu voice), and two working links. | Deck slides 5–7; video 15–30 s; `components/Planner.tsx` margin + voice sections |

**If the judge remembers one number, it must be "2 days"** — the Adaptation
Margin, not the +2 shift. Both are 2, which is a gift: *"The monsoon moved 2 days.
You have 2 days."* Use that pairing in the video voiceover and on deck slide 5.
If the judge remembers one sentence, it is the one-line value above.

---

## 5. Video + deck narrative alignment

Both artifacts must tell the **same story in the same order with the same numbers**.
Current drift to fix:

### `docs/deck.html` — changes required

1. **Slide 7 (BLOCKER):** replace `[VERCEL URL — pending deploy]` with
   **https://fasalshift.vercel.app/** and `[GITHUB URL — pending push]` with the
   real public repo URL once M1 is done. A deck submitted with placeholders is a
   Presentation failure in phases 2–3. Do this *before* exporting the deck.
2. **Slide 3:** add the M6 heat-reframe line (0 → 5 heat days, GDD +265 as the
   significant signal). Keep the p = 0.12 line exactly as written — it is correct.
3. **Slide 3, last bullet (M4):** "Lahore +12 days, Multan −5, Layyah −4" —
   verify the n = 4 issue first; if unverified by Sun 10:00 AM PT, replace with:
   *"Other districts: onset series too sparse under the 7.5 mm rule to report a
   trend — Faisalabad (n = 22 years) is the verified district."*
4. **Slide 4 (M3):** add the wet-year water note under the table (or the
   recomputed scores if the strong fix is done — update table + totals together:
   Pulses 7.2 / Cotton 6.2 / Maize 6.0 with the 1.0 cap; winner unchanged).
   Also fix the fine print if the strong fix is done (it currently says water
   uses the 2.12× ratio — true for display, and the cap must be recorded next
   to it).
5. **Slide 5 (N2, 10 min):** add the all-district margin line — Multan 8,
   Layyah 3, Lahore 2 (already computed; currently only Multan + Layyah are named).
6. **Slide 2:** already correct and honest (POWER live / IMERG-SMAP blocked /
   Landsat-ECOSTRESS metadata / ERA5 labelled). No change, except: if N1 is done,
   upgrade the Landsat row from "metadata verified" to "latest granule Oct 4,
   2026, shown live in-app".
7. **Export:** print `deck.html` to PDF (7 slides exactly — count before
   uploading) and host the PDF at a public link (repo `docs/` raw link, Google
   Drive public, or the same host as the video). The demo field takes **one**
   link: if both deck and video exist, submit the **video** as the demo link and
   put the deck PDF link in Project Details (or vice versa — but never submit a
   link that needs a login; test both logged-out).

### `docs/DEMO-SCRIPT.md` — changes required

1. **End card (BLOCKER):** "Live app URL · GitHub repo" must become the two real
   URLs (live: https://fasalshift.vercel.app/; repo: per M1). The checklist
   already requires this — enforce it at recording time.
2. **0–5 s hook:** match deck slide 1's question verbatim on screen:
   *"What do I plant after wheat — and when?"* (currently the shot is the
   problem line; make the question the on-screen text).
3. **5–15 s voiceover (M6):** after the +2 line, add the heat proof in one breath:
   on-screen text becomes *"Growing window shifted +2 days · grain-fill heat days
   0 → 5 · NASA POWER, live"*.
4. **15–25 s:** unchanged — Pulses 7.4 ★ / Cotton 6.8 / Maize 6.5 (or 7.2 / 6.2 /
   6.0 if the M3 strong fix is done — script, deck and app must match; pick one
   set and update all three).
5. **25–30 s:** add the margin pairing (M6/§4): voiceover ends
   *"The monsoon moved 2 days. You have 2 days."* then *"FasalShift — built on
   NASA open data."* Keep the Urdu voiceover + **English subtitles burned in**
   (submission must be understandable in English; the script already provides
   subtitle text — verify subtitles are actually rendered in the recording).
6. **Checklist:** add — "Deck PDF exported (7 slides) and public link tested
   logged-out" and "Repo URL on the end card is the public repo, opened once
   logged-out".

### Numbers lock (all three artifacts must match — do not change these without updating all three + the form)

| Number | Value | Source |
|---|---|---|
| Faisalabad shift | +2 days (2004 Jun 16 → recent median Jun 18) | Live NASA POWER, `data/districts.json` |
| Trend | −0.54 days/yr, p = 0.12 — **not significant** | OLS, n = 22 |
| GDD | 2,416 → 2,681 | Live NASA POWER |
| Grain-fill heat days | 0 → 5 | Live NASA POWER (2004 max 27.89 °C verified) |
| Rotations (Faisalabad) | Pulses 7.4 ★ / Cotton 6.8 / Maize 6.5 (or 7.2 / 6.2 / 6.0 with M3 strong fix) | `lib/rotation.ts` |
| Adaptation Margin | Faisalabad 2, Multan 8, Layyah 3, Lahore 2 days | `lib/rotation.ts` stress test |
| 2025 monsoon | 2.12× climatology (5.02 vs 2.37 mm/day) | Live NASA POWER |
| Soil | 0.156 m³/m³ Faisalabad — **Open-Meteo/ERA5, NOT SMAP** | Labelled fallback |
| Tests | 31/31 passing | `tests/` |

---

## 6. Risks

### Could disqualify (check each before pressing submit)

| # | Risk | Check |
|---|---|---|
| R1 | **Missed deadline / wrong timezone.** Official 2026 video: closes 11:59 PM *in the Team Owner's Local Event timezone*. Working deadline here is 11:59 PM ET; confirm the exact timezone on the team project page. | Submit by the **12:00 PM PT target** — ~9 h buffer either way. Never plan a Sun-evening submit. |
| R2 | **Private repo / placeholder links.** Repo still local-only; deck slide 7 + draft still have placeholders. | M1. Open every submitted link logged-out before submitting. |
| R3 | **Missing sources / AI non-disclosure.** Every dataset must be cited; AI use must be disclosed (2026 submission fields include both). | M5. `SOURCES.md` in the repo + /sources page live + AI field filled. |
| R4 | **Demo link needs login / permission.** A Drive link left on "restricted", a YouTube video left private, a Vercel deployment with protection back on. | Test demo + live + repo links in a logged-out/private window. Deployment Protection OFF (verified ~10:26 PT — re-verify after any redeploy). |
| R5 | **Pre-event work accusation.** Only scaffold + research + API verification existed before Nov 14 (per `STATUS.md` compliance note); all challenge code was written Nov 14. | True on the record. Do not claim otherwise; do not backdate anything. Keep `STATUS.md` + git history as the paper trail. |
| R6 | **NASA branding misuse.** | None in the app/deck (text mentions only). Verify once: no NASA logo, flag, or "meatball" in the deck, video, or app. |
| R7 | **Non-English submission / unsubtitled video.** Project page must be in English; Urdu voiceover needs English subtitles. | Form in English; subtitles burned into the video (M2/§5). |

### Could lose points (mitigations in §3)

| # | Risk | Cost | Mitigation |
|---|---|---|---|
| R8 | Water 10/10/10 discovered by a judge | Validity −1 | M3 (strong fix or honest note) |
| R9 | Lahore +12 / n = 4 trends probed | Validity −1 | M4 (verify or drop) |
| R10 | Hero +2 with p = 0.12 framed as a trend claim | Validity −1, credibility | M6 — never claim the trend; lead with heat/GDD |
| R11 | No pilot users / no adoption channel | Impact capped at 4 | N4 (name the channel honestly); never invent a pilot |
| R12 | "Only one NASA dataset live" (POWER only; IMERG/SMAP/Landsat not wired) | Validity / Best Use of Data lane | N1 (CMR granule line) or accept — POWER daily + climatology is two live NASA APIs, which satisfies the gate; say so |
| R13 | Rule-based scoring mistaken for measured yields | Validity −1 | Already labelled in app + deck + spec ("labelled rule", "not a model prediction"). Keep every label; do not upgrade the language on the form |
| R14 | Video missing (deck only) | Presentation −1 (not fatal — deck alone is legal) | M2 |
| R15 | Weekend collision: HackGlobal + Catalyst + Code-for-a-Billion deadlines Sun | Missed NASA target | NASA submit **first**, by 12:00 PM PT Sun, before the other deadlines bite (per sprint plan §3) |

### Biggest risk

**R2 — an unsubmittable package at the deadline: repo still private and/or
placeholder links in the demo, while hours are spent chasing SMAP/IMERG or a
pilot user.** The science is done and honest; the logistics are not. Every hour
between now and Sun 12:00 PM PT should be spent in M1 → M2 → M5 order, with M3/M4
fitted around them. If only one thing gets done, it is M1: a public repo with
real links is worth more than any further feature, because phases 2 and 3 judge
nothing else.

---

## Appendix — file map for the parent agent (what to change, what not to touch)

- **Do NOT edit app code in this task** (per instructions). All M-items that touch
  code (M3 strong fix, N1, N3) are specified here for the *builder* to execute
  with tests re-run; this document only specifies them.
- **Docs to edit:** `docs/deck.html` (§5), `docs/DEMO-SCRIPT.md` (§5),
  `docs/SUBMISSION-DRAFT.md` (M5, N4), `docs/ROTATION-SCORING.md` (only if M3
  strong fix is done — record the 1.0 cap as a labelled rule).
- **Code that would change (builder only):** `lib/rotation.ts` (M3 cap),
  `components/Planner.tsx` (M3 minimum-fix note; N1 card), `app/api/nasa/cmr/route.ts`
  (new, N1), `components/DistrictMap.tsx` (new, N3).
- **His-only steps (cannot be done from the VM):** GitHub push, 30 s video
  recording, Earthdata login (not needed — see N5), final submission approval +
  submit click, participant survey (Step 06, after submitting).
