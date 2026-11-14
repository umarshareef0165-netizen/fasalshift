# FasalShift — Design / UI Audit

- **Scope:** Audit ONLY. No app code was edited.
- **Date:** Sat 2026-11-14 (audit run ~10:35 AM PT; submission closes Sun Nov 15, 11:59 PM ET)
- **Live site checked against:** `https://fasalshift.vercel.app/` (URL from task brief; code audit is of the files listed below — no live-browser pixel measurement was possible in this session, so first-screenful calls are based on the actual DOM order + CSS sizes in the source)
- **Files read in full:** `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/Planner.tsx`, `components/DistrictPicker.tsx`, `components/ShiftCard.tsx`, `components/RotationCompare.tsx`, `components/GddPanel.tsx`, `components/LiveDataPanel.tsx`, `components/SoilCard.tsx`, `app/sources/page.tsx`, `docs/deck.html`
- **Real data used (no invented numbers):** Faisalabad onset shift **+2 days** (2004-06-16 → recent median 2024-06-18, `data/districts.json`), trend slope **−0.54 days/year, p = 0.124 → displayed as p = 0.12, n = 22**, GDD **2,416 → 2,681** (2,680.74), heat days **0 → 5**, Wheat→Pulses **7.4** (deck slide 4; runtime-computed in the app), Adaptation Margin **2 days Faisalabad** (deck slide 5). Lahore +12, Multan −5, Layyah −4 (from `data/districts.json`).
- **Method for contrast:** WCAG 2.x relative-luminance formula, computed in Python for every pair below (not estimated). Thresholds: **4.5:1** normal text, **3:1** large text (≥24 px, or ≥18.66 px bold) and non-text UI / graphical objects (WCAG 1.4.11).

## Verdict in one paragraph

The palette is fundamentally sound — green-on-white, gold-on-green and ink-on-white all pass AA comfortably — but the **winner is almost invisible as a winner**: its only differentiators are a gold border/shadow at **1.67:1** on white and a small badge that protrudes into a 14.4 px gap. The first screenful sells the shift (+2 days) but **not the recommendation** (Wheat→Pulses 7.4 is a full scroll below the hero) and **not the NASA provenance** (no NASA badge anywhere above the live-data panel). The deck's single worst text failure is its gold placeholder text. Fix the P0s and a judge can grasp shift + recommendation + NASA data in 30 seconds; as shipped, they grasp only the shift.

---

## 1. 30-SECOND GRASP TEST — what a first-time judge sees

DOM order in `components/Planner.tsx` (this is the render order, no reordering CSS exists):

`site-header` (brand + tagline) → DistrictPicker → ShiftCard (hero) → RotationCompare → weights note + water badge → Adaptation Margin card → GDD + Soil (two-col) → LiveDataPanel → Voice summary card (+ Sources link) → footer

| # | Judge question (30 s) | Visible in first screenful? | Evidence |
|---|---|---|---|
| 1 | What is this, in one line? | **PARTLY** — tagline only | `Planner.tsx` tagline: "Which rotation should a Punjab farmer plant next — from live NASA data." Good line, but it is 1rem `#cfe3d4` (8.23:1, passes) under the brand name, with no supporting one-line outcome. There is no "Answer: plant Wheat→Pulses" line anywhere near the top. |
| 2 | The +2 days hero | **YES on desktop, BORDERLINE on mobile** | `ShiftCard.tsx` `.shift-hero`, `.hero-number` 3.4rem mobile / 4.2rem ≥640px, white on `#1b4332` (11.08:1). On a 390×844 phone the header (~180 px) + picker (~180 px, 2 rows) push the hero number to ~y 400–450 — visible, but only just; on a 667 px-tall phone it sits at/below the fold. On desktop 800 px viewport it is comfortably visible. |
| 3 | The recommended rotation (Wheat→Pulses 7.4) | **NO — buried one full section below the hero** | `RotationCompare.tsx` renders only after `ShiftCard`. The winner's name + 7.4 total are not repeated in the header, the hero, or a summary strip. A judge who stops at the hero never learns the recommendation. |
| 4 | NASA-data badge / provenance | **NO — nowhere in the first screenful** | The only NASA badges are `LiveDataPanel.tsx` (`sourceBadge`: "NASA POWER Daily, fetched …") and the footer ("Built on NASA open data…"), both far below the fold. The header has no "Live NASA POWER" badge, no NASA wordmark, no fetched-date. The tagline says "live NASA data" in words only. |
| 5 | The honest limit (p = 0.12, not significant) | **YES if the hero is visible, but visually minimised** | `ShiftCard.tsx` `.trend-line` sits directly under the hero: "Onset is shifting −0.5 days/year (p = 0.120) · 22 years in trend — trend not statistically significant". The warning is `#9d0208` on `#edf7ef` (7.83:1, passes) and bold, but the surrounding line is `.muted` `#4a5750` 7.58:1 on white at ~0.92rem-equivalent size, and the whole block is a pale-green strip that reads as a footnote. It is honest and present — do not hide it — but it is easy to skim past. |
| 6 | Adaptation Margin (2 days) | **NO — third section down** | `Planner.tsx` margin card renders after RotationCompare. Not in the hero, not in the summary. |

### P0 — 30-second grasp (see §6 for the full P0 list)

- **P0-1 — Add a one-line answer strip directly under the header / above the picker** (`components/Planner.tsx`, between `</header>` and the picker `<section>`, new element e.g. `<p className="answer-strip">`). Current: nothing. Proposed: a single line using only live values already in the component — district name, `shiftDays`, winner name + total, e.g. "Faisalabad: monsoon +2 days · Plant Wheat → Pulses (7.4/10) · Live NASA POWER". Style it as dark-green text on gold-tinted/white strip so it is scannable, not as a paragraph. Why: this is the only change that makes all four 30-second facts visible without scrolling.
- **P0-2 — Add a "Live NASA POWER" badge in the header** (`components/Planner.tsx`, `.header-row` next to `.lang-toggle`, or under the tagline). Current: no badge in `site-header`. Proposed: `<span className="badge">● Live NASA POWER</span>` reusing the existing `.badge` (green-deep `#1b4332` on green-soft `#d8f3dc`, 9.38:1) — on the dark header it needs a light variant (see P0-7: do not put `#d8f3dc` text on green; use a gold-outline pill with white text, white on `#1b4332` = 11.08:1). Include the fetched date only if it is already available as `cache.generatedAt` — do not invent a date. Why: provenance is the Challenge 7 credibility test; a judge should not have to scroll to the live-data panel to know the numbers are NASA data.
- **P0-3 — Repeat the winner inside/just under the hero** (`components/ShiftCard.tsx`, inside `.shift-hero` after `.hero-sub`, or `components/Planner.tsx` passing `winner` into `ShiftCard`). Current: `ShiftCard` receives no winner prop; the winner exists only in `Planner.tsx` (`winner` memo) and `RotationCompare`. Proposed: one line in the hero, e.g. "Recommended: Wheat → Pulses — 7.4/10" in white/gold (gold `#e9c46a` on `#1b4332` = 6.63:1, passes) — values must come from the existing `winner` object, not hardcoded. Why: couples the hero number to the decision in the same glance.

---

## 2. COLOUR + ACCESSIBILITY AUDIT — computed ratios (WCAG formula)

### 2a. Full pair table — app (`app/globals.css` + components)

| Foreground on background | Ratio | Verdict | Where used |
|---|---|---|---|
| `#e9c46a` gold on `#1b4332` green-deep | **6.63:1** | PASS AA normal | `.brand-gold`, `.shift-hero .hero-label`, `.badge.gold` text is the reverse (below) |
| `#1b4332` on `#e9c46a` gold | **6.63:1** | PASS AA normal | `.badge.gold`, `.rec-badge`, `.lang-toggle:hover` |
| `#ffffff` on `#1b4332` | **11.08:1** | PASS | `.site-header`, `.shift-hero`, `.voice-btn`, table `th` in deck |
| `#cfe3d4` tagline on `#1b4332` | **8.23:1** | PASS | `.site-header .tagline` |
| `#d7e8dc` hero-sub on `#1b4332` | **8.69:1** | PASS | `.shift-hero .hero-sub` |
| `#a9c6b2` hero-dates on `#1b4332` | **6.02:1** | PASS AA normal | `.shift-hero .hero-dates` (0.9rem — **passes; do not darken unnecessarily**) |
| `#2d6a4f` green-mid link on `#ffffff` | **6.39:1** | PASS | `a` on cards |
| `#2d6a4f` link on `#f6f8f5` page | **5.98:1** | PASS | `a` on page background |
| `#1b4332` headings on `#ffffff` | **11.08:1** | PASS | `.card h3`, `.section > h2`, `.rotation-card h3/.total` |
| `#1b4332` on `#f6f8f5` | **10.37:1** | PASS | headings on page |
| `#1c2420` ink on `#ffffff` | **15.88:1** | PASS | body text |
| `#1c2420` on `#f6f8f5` | **14.87:1** | PASS | body text on page |
| `#4a5750` ink-soft on `#ffffff` | **7.58:1** | PASS | `.muted`, `.dim-label`, `.urdu-name`, `td.missing`, `.kv dt` |
| `#4a5750` on `#f6f8f5` | **7.10:1** | PASS | `.muted` on page |
| `#4a5750` on `#edf7ef` green-pale | **6.91:1** | PASS | Urdu name on selected picker button |
| `#4a5750` on `#e9ecef` grey badge | **6.39:1** | PASS | `.badge.grey` |
| `#5f6f66` muted grey on `#ffffff` | **5.31:1** | PASS AA normal (thin margin) | `.fine-print`, deck `.fine` / `.hero small` |
| `#5f6f66` on `#f6f8f5` | **4.98:1** | PASS AA normal (thin margin — 0.48 above the line) | `.fine-print` if ever placed on page bg |
| `#5f6f66` on `#edf7ef` | **4.85:1** | PASS (thin) | fine print on pale green |
| `#9a7418` gold-dark on `#ffffff` | **4.30:1** | **FAIL AA normal (4.5); PASS large/non-text 3:1 only** | `.rotation-card.winner .bar-fill` (background, not text — see below) |
| `#9a7418` on `#fffdf4` winner bg | **4.22:1** | FAIL normal; PASS large/non-text | winner bar on winner card |
| `#9d0208` danger on `#edf7ef` | **7.83:1** | PASS | `.trend-line .sig-warn` |
| `#9d0208` on `#ffffff` | **8.59:1** | PASS | danger text generally |
| `#1b4332` on `#d8f3dc` green-soft | **9.38:1** | PASS | `.badge` |
| `#ffffff` on `#2d6a4f` | **6.39:1** | PASS | `.voice-btn:hover` |
| `#ffffff` on `#9aa5a0` disabled | **2.54:1** | **FAIL AA even for large text** | `.voice-btn:disabled` |
| `#1c2420` on `#9aa5a0` | **6.25:1** | PASS | candidate disabled-text colour (see P1-6) |

### 2b. Non-text / UI-component contrast (WCAG 1.4.11, needs 3:1)

| Element | Ratio | Verdict |
|---|---|---|
| Gold `#e9c46a` winner border + `box-shadow: 0 0 0 2px` on white | **1.67:1** | **FAIL — worst failure in the whole audit** |
| Gold `#e9c46a` winner border on winner bg `#fffdf4` | **1.64:1** | **FAIL** |
| Gold `#e9c46a` focus outline (`a:focus-visible, button:focus-visible`) on white | **1.67:1** | **FAIL** (WCAG 2.4.11 focus indicator) |
| Gold `#e9c46a` focus outline on page `#f6f8f5` | **1.56:1** | **FAIL** |
| Gold `#e9c46a` `.section > h2` 3px underline on white | **1.67:1** | FAIL 3:1 as a meaningful indicator — decorative only, so lower risk, but do not rely on it to signal anything |
| `#d9e2db` `--line` card/picker borders on white | **1.32:1** | FAIL 3:1 — acceptable for a *decorative* container border, **not** acceptable as the sole selected-state indicator (see P1-3: the picker selected state fortunately also uses a dark border + pale fill, so it survives) |
| `#e6ebe7` `.bar-track` on white | **1.21:1** | FAIL 3:1 as a track — the *fill* is what carries meaning, and the fills pass (below), so P2 only |
| `#2d6a4f` bar-fill on `#e6ebe7` track | **5.30:1** | PASS |
| `#9a7418` gold-dark winner bar-fill on `#e6ebe7` track | **3.56:1** | PASS (just above 3:1) |
| `#9a7418` gold-dark winner bar-fill on white | **4.30:1** | PASS non-text |
| `#1b4332` selected-picker border on white | **11.08:1** | PASS |
| `#e0a3a0` `.notice.warn` border on white | **2.12:1** | FAIL 3:1 — decorative border only; the warning meaning is carried by text, so P2 |
| `#e9c46a` lang-toggle border on `#1b4332` header | **6.63:1** | PASS |

**Corrections to the brief's "check especially" items (measured, not assumed):**
- **Gold-on-green passes.** `#e9c46a` on `#1b4332` = 6.63:1. Keep it.
- **Grey-on-white passes — but only just.** `#5f6f66` on white = 5.31:1, on page = 4.98:1. It is *not* a failure; do not "fix" it by lightening anything, and do not use it below 0.82rem or on `#edf7ef` (4.85:1) without the P2 darkening below.
- **Gold-dark as *text* would fail normal text** (4.30:1 on white) — but it is currently used only as a bar-fill background, where it passes 3:1. The risk is a future edit using `var(--gold-dark)` for text. Add the guard in P1-5.
- **The winner-card gold border/background is the real failure:** border 1.67:1 + winner bg `#fffdf4` vs white 1.11:1 (row/card distinction is effectively invisible except for the badge). See P0-4.

### 2c. Deck (`docs/deck.html`) pair table

| Foreground on background | Ratio | Verdict | Where |
|---|---|---|---|
| `#1b4332` kicker / h1 / h2 / `.hero` / `.num` on `#fff` | **11.08:1** | PASS | all slide headings, hero numbers |
| `#1c2b22` body on `#fff` | **14.81:1** | PASS | slide body |
| `#5f6f66` `.fine` (14 px) on `#fff` | **5.31:1** | PASS AA normal | slide footnotes |
| `#5f6f66` `.hero small` (22 px, 600) on `#fff` | **5.31:1** | PASS (large text, needs only 3:1) | "+2 days" unit, "2 days" unit |
| `#ffffff` table `th` on `#1b4332` | **11.08:1** | PASS | slide 2 + 4 table headers |
| `#1c2b22` on `#fdf3d7` winner row | **13.38:1** | PASS (text) | slide 4 winner row text — but the *row background itself* vs white is **1.11:1**, so the row is distinguished by bold + "★ Recommended" text only |
| `#b7791f` `.gold` on `#fff` | **3.64:1** | **FAIL AA normal (4.5:1); PASS large only — and the text is 18 px normal, i.e. NOT large** | slide 7 placeholders `[VERCEL URL — pending deploy]` / `[GITHUB URL — pending push]` |
| `#cfe3d4` `.footer` on `#123524` body | **9.99:1** | PASS | deck footer below the slides |
| `#d8e2da` table borders on `#fff` | **1.33:1** | FAIL 3:1 decorative — acceptable for gridlines, not as a sole indicator | slide 2 + 4 tables |

---

## 3. MOBILE + LAYOUT

Breakpoints in `app/globals.css`: **one** breakpoint only — `@media (min-width: 640px)`. Nothing between 640–1080 px, nothing for very small screens, no `max-width` guard on the hero number.

| # | Location | Current | Problem | Proposed |
|---|---|---|---|---|
| P1-8 | `globals.css` `@media (min-width: 640px)` — `.rotation-grid { grid-template-columns: repeat(3, 1fr); }` | 3 columns from 640 px | At 640–800 px each card is ~180–200 px wide; `.dim-row` is `5.5rem 1fr 2.2rem` (≈88 + 35 px fixed), leaving a ~40–60 px bar track — bars are unreadable and labels wrap. | Keep 1 column <640 px, **2 columns at 640–899 px, 3 columns only at ≥900 px** (`@media (min-width: 900px)` for the 3-col rule; add a 640 px 2-col rule). No new numbers needed. |
| P1-9 | `globals.css` `.picker` | `repeat(2, 1fr)` <640 px, `repeat(4, 1fr)` ≥640 px | At 320 px wide each button is ~139 px: "Faisalabad" (1rem semibold) + Urdu line fits but with ~0.5rem side padding there is no slack for Urdu-script widening / font fallback; at 360 px it is fine. No `min-height` / touch-target guarantee is declared. | Add `min-height: 56px` to `.picker button` (44 px WCAG target + Urdu second line) and reduce side padding to `0.7rem 0.35rem` below 640 px. Do not change the 2-col layout — it is correct for 4 districts on mobile. |
| P1-10 | `globals.css` `.two-col` | Only defined inside `@media (min-width: 640px)` as `1fr 1fr` | At exactly 640 px the GDD + Soil cards are ~300 px each; `.kv { grid-template-columns: auto 1fr; }` squeezes the Soil `dd` (source string "Open-Meteo archive (ERA5 reanalysis) — NOT SMAP") and the GDD season lines wrap awkwardly. | Move `.two-col` to **≥900 px** (same breakpoint as P1-8) so 640–899 px stacks GDD above Soil at full width. |
| P2-7 | `globals.css` `.shift-hero .hero-number` | `3.4rem` mobile, `4.2rem` ≥640 px, no `clamp()` / no max | At 320 px, "+2 days" at 3.4rem (~54 px) + unit fits, but a 2-digit shift (e.g. Lahore +12, from real data) at the same size is tight against the card padding; at very wide screens 4.2rem is fine. | `font-size: clamp(2.8rem, 11vw, 4.2rem)` so the number scales down on narrow screens instead of overflowing. No content change. |
| P2-8 | `components/LiveDataPanel.tsx` `.table-wrap` + `globals.css` `table.live-table` | `.table-wrap { overflow-x: auto; }`, cells `white-space: nowrap` | Correct pattern — the table *does* scroll horizontally on mobile rather than breaking layout. Remaining flaw: the missing-cell text "— not yet published" is long and `nowrap`, so a single missing day forces the whole table wide; and there is no `scope="col"` on `<th>` and no sticky first column, so on a 320 px screen the Date column scrolls away and the numbers lose their row label. | (a) Allow the missing-cell text to wrap: `table.live-table td.missing { white-space: normal; }` (keep other cells nowrap). (b) Add `scope="col"` to the four `<th>` elements. (c) Optional: `position: sticky; left: 0; background: #fff;` on first column — only if it can be tested on a real phone; otherwise skip. |
| P2-9 | `app/sources/page.tsx` — "table overflow on /sources" | **There is no `<table>` on /sources.** The page is `.sources-list` cards + a method-notes list. | The brief's premise is wrong for this page; the real overflow risk is the long URLs in `<code>` — already handled by `.sources-list code { word-break: break-all; }`. Verified: no horizontal-overflow source on this page. | No fix needed. Do **not** add a table wrapper. (If a table is added later, reuse `.table-wrap`.) One real nit: the `/sources` header `<h1>` ("FasalShift — Sources & method") at 1.9rem on a 320 px screen wraps to 3 lines — acceptable, no change. |
| P2-10 | `globals.css` `.rotation-card .rec-badge` | `position: absolute; top: -0.75rem; right: 1rem;` | The badge protrudes 12 px above the card into the grid gap of 0.9rem (14.4 px) — 2.4 px clearance. On the first row it nearly touches the section `<h2>`; on stacked mobile cards it nearly touches the card above. It is not clipped (no `overflow: hidden` on the card), but it looks cramped and risks overlap if the heading wraps to two lines in Urdu. | Add `margin-top: 0.75rem` to `.rotation-grid` (or `padding-top` on the grid container) so the badge has a full 12 px of clear space, and keep the badge. See also P0-5 for visibility. |
| P2-11 | `app/layout.tsx` | No `viewport` export; `<html lang="en">` only | Next.js supplies a default viewport, so this is not a live bug — but it is unverified in this audit (no live-browser check was possible). The deck (`docs/deck.html`) *does* declare `<meta name="viewport" content="width=device-width, initial-scale=1">`. | Add `export const viewport = { width: 'device-width', initialScale: 1 };` to `app/layout.tsx` so mobile scaling is explicit, not framework-default. Verify on the live URL after deploy. |

---

## 4. JUDGE-FRIENDLY UX

| # | Question | Finding | Fix |
|---|---|---|---|
| 4a | **District switching clarity — is it obvious the numbers change?** | **WEAK.** `DistrictPicker.tsx` uses `aria-pressed` + `.picker button[aria-pressed="true"]` (`border-color: #1b4332; background: #edf7ef; box-shadow: inset 0 0 0 1px`). That state *is* distinguishable (dark border 11.08:1 + pale fill), but there is (1) no checkmark / "Selected" text, (2) no visible "Showing: Faisalabad" heading anywhere — the hero label is the generic "Growing window shifted", the hero-sub shows dates but **not the district name**, and the rotation heading is the generic "Which rotation should you plant next?", (3) no transition/animation on the hero number, so a tap that changes +2 → +12 (Lahore, real data) is the only signal, and (4) `ShiftCard` has `aria-live="polite"` on the hero div (good) but the `.trend-line` below it is *outside* that live region, so the p-value line is not announced on switch. The water-availability badge also changes asynchronously via `fetch` in `Planner.tsx` with only a grey "Checking live monsoon data…" badge as loading state. | **P1-11** (`components/ShiftCard.tsx` + `components/Planner.tsx`): pass the district name into `ShiftCard` and render it in the hero, e.g. hero-label becomes "Growing window shifted — Faisalabad" (value from `district.name`, already in props). **P1-12** (`components/DistrictPicker.tsx` + `globals.css`): add a visible `✓` (or the word "Selected" in the active language) inside the pressed button — do not rely on border + fill alone. **P2-12**: move the `.trend-line` inside the `aria-live` region (or add `aria-live="polite"` to it) so screen-reader users hear the p-value change. |
| 4b | **"Recommended" badge visibility** | **WEAK — see §2b.** `RotationCompare.tsx` `.rec-badge` is 0.8rem, gold bg (`#e9c46a` on `#1b4332` = 6.63:1, passes), but it is the *only* text that says "Recommended"; the winner card's other signals are a 1.67:1 gold border and a `#fffdf4` bg that is 1.11:1 vs white. The badge's absolute position (`top: -0.75rem`) leaves 2.4 px clearance (P2-10). A judge scanning fast sees three near-identical cards with totals 7.4 / 6.8 / 6.5 — the 0.6 gap does not read as a decision. | **P0-5** (with P0-4): enlarge the badge to **0.9rem, padding `0.3rem 0.85rem`**, keep gold bg + green-deep text (6.63:1), and add a second, in-flow signal inside the winner card — e.g. a "★ Recommended — best water + soil" line under the total using the existing `reason` text, or a left accent. Do not add a new score. |
| 4c | **Honest-limits notes — visible without hiding the win?** | **MIXED — honest, but scattered and late.** Present and correctly worded: p = 0.12 "trend not statistically significant" (`ShiftCard.tsx`, red bold, 7.83:1); heat-cap note "2004 baseline had 0 heat days, so heat pressure is capped at 2.0×" (`GddPanel.tsx`, `.fine-print` `#5f6f66` 5.31:1 on white); "Open-Meteo archive (ERA5 reanalysis) — NOT SMAP" (`SoilCard.tsx`, `.muted small`); "No pilot users yet" (footer in `Planner.tsx` + `app/sources/page.tsx` footer + method notes); "NASA POWER daily data lags about 2 days" (`LiveDataPanel.tsx` lag note + `/sources` method notes). **But:** the footer limit ("No pilot users yet") is at the very bottom of a long page; the soil NOT-SMAP note is inside the Soil card only (and only when `isOpenMeteo` is true — correct behaviour, but a judge who never scrolls to Soil never sees it); the weights note ("Scores 0–10. Weights: water 35%…") is a `.muted small` paragraph *below* the rotation grid where it reads as a footnote. None of this hides the win — the win (7.4) is stated plainly — but a judge has to scroll the whole page to collect the limits. | **P1-13** (`components/Planner.tsx`): add one compact "Honest limits" line directly under the rotation section (not the footer), reusing only strings that already exist: "Trend p = 0.12 (not significant) · Soil is ERA5, not SMAP · No pilot users yet · POWER lags ~2 days." Keep it `.muted` (7.58:1) — visible, not shouted. **Do not** move the p = 0.12 note away from the hero; it belongs there. |
| 4d | **Voice-summary discoverability** | **POOR.** `Planner.tsx` voice card is the **last** `<section>` before the footer — after the margin card, GDD/Soil, and the 14-row live table. The button itself is good (`.voice-btn`, white on `#1b4332` 11.08:1, 700 weight, clear label "🔊 Listen in Urdu"), but a judge will not scroll that far in 30 seconds, and there is no link, icon, or mention of voice anywhere in the header or hero. The Urdu toggle in the header is visible, but it switches *text* language — it does not advertise the spoken summary. | **P1-14** (`components/Planner.tsx`): add a small text link / button in the header row next to `.lang-toggle` ("🔊 Listen") that smooth-scrolls to the voice card (anchor `#voice-summary`, add that `id` to the voice `<section>`), **or** move the voice button into the hero-adjacent answer strip (P0-1). Do not autoplay, do not add a second voice implementation — reuse the existing `speakSummary`. **P2-13**: give the voice `<section>` an `id="voice-summary"` in any case, so the deck / demo script can link straight to it. |
| 4e | **Other UX nits found while reading** | (1) `RotationCompare.tsx` bar `role="img"` is on the *track* span with an `aria-label`, but the inner `.bar-fill` span has no `aria-hidden` — harmless duplication, screen readers may announce the fill as an empty element. (2) `LiveDataPanel.tsx` missing-cell text "— not yet published" is honest and correct. (3) `Planner.tsx` water badge: the fallback state uses `.badge.gold` ("Live monsoon data unavailable — using climatology baseline") — gold badge + dark text passes (6.63:1), but a gold badge reads as "highlight/good" while the message is a *fallback*; consider `.badge.grey` for the fallback and reserve gold for the winner only. (4) No "back to top" / section nav — acceptable for a single-page planner, no change. | **P2-14**: add `aria-hidden="true"` to the `.bar-fill` span in `RotationCompare.tsx`. **P2-15**: change the water-fallback badge class from `badge gold` to `badge grey` in `Planner.tsx` (same text, no new copy). Both are one-line changes. |

---

## 5. DECK (`docs/deck.html`) — contrast / legibility audit

| # | Slide / selector | Current | Problem | Proposed |
|---|---|---|---|---|
| P0-6 | Slide 7, `.gold` spans | `[VERCEL URL — pending deploy]` / `[GITHUB URL — pending push]` in `#b7791f` (3.64:1 on white — **fails AA normal**) | Two failures in one: (a) the links are **placeholders on the closing slide** — a judge clicking/typing them gets nothing; (b) the colour itself fails AA for 18 px normal text. | Replace with the real live URL **`https://fasalshift.vercel.app/`** (verified live in the task brief) as a link/text in `#8a6d1b` (**4.90:1** on white, passes AA normal) — or keep `#1b4332` (11.08:1) and drop the gold class entirely. For the repo: insert the real GitHub URL **only if it exists**; if the push has not happened, write the honest line "Repo: push pending — link in the Space Apps submission form" in `#1b4332`, not a fake URL and not a gold placeholder. Do not invent a repo URL. |
| P1-15 | Slide 7, `.gold` class definition | `.gold { color: #b7791f; }` (3.64:1) | The class is used only on slide 7; any future use at body size fails AA. | Change the class to `#8a6d1b` (4.90:1). If a brighter gold is wanted for large display text only, restrict it to `.hero`-size text (≥24 px) and document that. |
| P1-16 | Slide 4, `tr.winner td` | `background: #fdf3d7` (1.11:1 vs white) + `font-weight: 700` | The winner row is distinguished by bold + "★ Recommended" text (good) but the tint is near-invisible in print / on a projector. | Darken to `#fbeeb8` (still pale, but visibly distinct in print) **and** add `border-left: 4px solid #7a5c0e` (6.24:1 on white) to the winner row. Keep the "★ Recommended" text — it is the accessible signal. |
| P1-17 | Slides 2 + 4, `table` | `font-size: 17px`, no responsive rule; `.slide { padding: 40px 44px; min-height: 540px; }`, `.deck { max-width: 960px; }` | On a phone / narrow projector window the 6-column slide-4 table and the long-text slide-2 table overflow the slide (no `overflow-x`, no `@media` except print). The `.hero` at 84 px also wraps awkwardly below ~400 px. | Add `@media (max-width: 640px) { .slide { padding: 28px 20px; min-height: 0; } .hero { font-size: 56px; } table { font-size: 14px; display: block; overflow-x: auto; } }`. Content unchanged. |
| P2-16 | Slide 3, hero + list | Hero "+2 days" (84 px, `#1b4332` 11.08:1) + bullets including "Trend 2004–2025: −0.54 days/year, p = 0.12 — not statistically significant" | Content is accurate against `data/districts.json` (slope −0.536, p 0.124, GDD 2,416 → 2,681, heat 0 → 5, Lahore +12 / Multan −5 / Layyah −4 — all verified). Legibility is good. One nit: the slide says "Recent median (2023–2025): June 18" — the cache stores that median as the 2024-06-18 date (dayOfYear 170, median of 152/170/171); the wording is correct but a judge may read it as "the 2024 date". | No colour/layout change. Optional copy tweak (P2): "Recent median onset (2023–2025): June 18" — same meaning, removes the ambiguity. Do not change the numbers. |
| P2-17 | Slide 5, hero | "2 days" hero + "Multan survives 8 days; Layyah 3 days" | Hero legibility passes (11.08:1). **Verification limit:** the Multan/Layyah margin figures are computed at runtime by `adaptationMargin()` in `lib/rotation` and are *not* stored in `data/districts.json`, so this audit could not re-verify them from the cache — they are not flagged as wrong, only as **unverified in this audit**. | Before presenting, re-run the app for Multan + Layyah and confirm the margin list shows 8 and 3. If either differs, correct the slide to the app's number — do not present the slide's number over the app's. |
| P2-18 | Slide 2, table status column | "Blocked — needs a free Earthdata login (not available during the sprint)" etc. | Honest and consistent with `/sources`. Text contrast passes (body `#1c2b22` 14.81:1). The table's `#d8e2da` gridlines are 1.33:1 — decorative, acceptable. | No change. |
| — | Deck `.fine` / `.footer` | `#5f6f66` 14 px on white 5.31:1; `#cfe3d4` on `#123524` 9.99:1 | Both pass AA normal. | No change. Do not lighten either. |

**Deck numbers cross-checked against `data/districts.json` (2026-11-14T17:28:39Z):** slide 3 onset dates (2004-06-16, recent 2024-06-18), slope −0.54, p 0.12, GDD 2,416 → 2,681, heat 0 → 5, district shifts (+12 / −5 / −4) — **all match**. Slide 4 totals (7.4 / 6.8 / 6.5) and slide 5 margins (2 / 8 / 3) are runtime-computed and were **not** re-verified from the cache in this audit; see P2-17.

---

## 6. PRIORITISED CHANGE LIST

### P0 — must-fix before submission (judge cannot grasp the win / link is dead / WCAG failure on a meaningful indicator)

| ID | File | Exact location / selector | Current | Proposed | Why (judge impact + ratio) |
|---|---|---|---|---|---|
| P0-1 | `components/Planner.tsx` | Between `</header>` and picker `<section>` (new element) | No answer line; first outcome (7.4) is a full scroll down | Add one-line answer strip from live values only: district + shift + winner name/total + "Live NASA POWER" | 30-second grasp: the recommendation is currently invisible without scrolling (§1, rows 3–4) |
| P0-2 | `components/Planner.tsx` | `.header-row`, next to `.lang-toggle` (new badge) | No NASA badge above the fold | Gold-outline pill, white text on `#1b4332` (11.08:1): "● Live NASA POWER" | Provenance is the Challenge 7 credibility test; currently only provable after scrolling to the live panel |
| P0-3 | `components/ShiftCard.tsx` (+ `Planner.tsx` props) | Inside `.shift-hero`, after `.hero-sub` (new line; needs `winner` prop) | Hero shows shift only; winner lives only in `RotationCompare` | "Recommended: Wheat → Pulses — 7.4/10" in gold `#e9c46a` on `#1b4332` (**6.63:1**) from the existing `winner` object | Couples shift → decision in one glance; no hardcoded numbers |
| P0-4 | `app/globals.css` | `.rotation-card.winner { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold); background: #fffdf4; }` | Gold border/shadow **1.67:1** on white; bg `#fffdf4` **1.11:1** vs white | `border-color: #7a5c0e; box-shadow: 0 0 0 2px #7a5c0e; background: #fdf6d8;` — border **6.24:1** on white (passes 3:1 non-text and 4.5:1 text); keep `.bar-fill` gold-dark | **Single worst failure in the audit (1.67:1).** The winner is currently indistinguishable except for its badge |
| P0-5 | `app/globals.css` + `components/RotationCompare.tsx` | `.rotation-card .rec-badge` | 0.8rem badge, 2.4 px clearance, sole "Recommended" signal | 0.9rem, `padding: 0.3rem 0.85rem`, same gold bg / green-deep text (**6.63:1**); add an in-flow "★ Recommended" line under the total | Badge is the only accessible winner signal and is small + cramped; totals 7.4 vs 6.8 do not read as a decision |
| P0-6 | `docs/deck.html` | Slide 7, two `.gold` spans | `[VERCEL URL — pending deploy]` / `[GITHUB URL — pending push]`, `#b7791f` **3.64:1** (fails AA normal) | Live URL `https://fasalshift.vercel.app/` in `#8a6d1b` (**4.90:1**) or `#1b4332`; repo URL only if real, else honest "push pending" line in `#1b4332` | Closing slide links are dead + the colour fails AA; a judge leaves with nowhere to click |
| P0-7 | `app/globals.css` | `a:focus-visible, button:focus-visible { outline: 3px solid var(--gold); }` | Gold outline **1.67:1** on white / **1.56:1** on page | `outline: 3px solid #1b4332;` on light backgrounds (**11.08:1**); keep gold only inside `.site-header` / `.shift-hero` where gold-on-green is **6.63:1** | Keyboard-focus indicator fails WCAG 2.4.11 / 1.4.11; a keyboard-using judge cannot see focus |

### P1 — should-fix (real judge friction or a real AA failure on a secondary element)

| ID | File | Exact location / selector | Current | Proposed | Why + ratio |
|---|---|---|---|---|---|
| P1-1 | `app/globals.css` | `:root --gold-dark: #9a7418` (guard, not a restyle) | 4.30:1 on white — fails AA normal *if used as text* | Add a comment + a new token `--gold-text: #7a5c0e` (**6.24:1** on white, **6.12:1** on `#fffdf4`) and use *that* for any future gold text; keep `#9a7418` only as bar-fill (passes 3:1 non-text at 4.30:1 / 3.56:1 on track) | Prevents the most likely next regression: someone styling a label with `var(--gold-dark)` |
| P1-2 | `docs/deck.html` | `.gold { color: #b7791f; }` | 3.64:1 on white, fails AA normal | `#8a6d1b` (**4.90:1**) | Same failure as P0-6, class-level fix so any reuse passes |
| P1-3 | `app/globals.css` | `.voice-btn:disabled { background: #9aa5a0; }` (white text) | White on `#9aa5a0` **2.54:1** — fails even large text | `background: #757575;` (white on it **4.61:1**) **or** keep bg and set `color: #1c2420` (**6.25:1**). Prefer the `#757575` bg (keeps white text consistent) | Disabled state is WCAG-exempt, but the button is visible to every judge; 2.54:1 is unreadable in sunlight/projector |
| P1-4 | `components/Planner.tsx` | Water-fallback `<span className="badge gold">` | Gold badge for a *fallback* message ("Live monsoon data unavailable…") | `badge grey` (ink-soft `#4a5750` on `#e9ecef` **6.39:1**), same text | Gold currently means "winner/highlight"; using it for a fallback mis-signals status |
| P1-5 | `components/Planner.tsx` | Rotation `<section>`, after `RotationCompare` | Honest limits scattered: p = 0.12 at hero, NOT-SMAP in Soil card, "No pilot users yet" in footer only | One compact limits line under the rotation grid reusing existing strings: "Trend p = 0.12 (not significant) · Soil is ERA5, not SMAP · No pilot users yet · POWER lags ~2 days" in `.muted` (**7.58:1**) | Judge collects all limits without scrolling the whole page; win stays front-and-centre |
| P1-6 | `components/Planner.tsx` | Header row (new link) + voice `<section>` | Voice card is the last section; no header mention | Add header "🔊 Listen" link scrolling to `#voice-summary`; add `id="voice-summary"` to the voice section; reuse existing `speakSummary` | Voice is a differentiator (Urdu-first) that no judge will find at the bottom of the page |
| P1-7 | `components/ShiftCard.tsx` + `Planner.tsx` | `.hero-label` / hero-sub | Hero never names the district | Hero-label "Growing window shifted — {district.name}" (from `district.name`, already in props) | District switching is otherwise invisible except for the number changing (§4a) |
| P1-8 | `components/DistrictPicker.tsx` + `globals.css` | `.picker button[aria-pressed="true"]` | Selected = dark border + pale fill only | Add visible `✓` / "Selected" text inside the pressed button | Selected state should not rely on border + fill alone |
| P1-9 | `app/globals.css` | `@media (min-width: 640px) .rotation-grid` | 3 cols from 640 px → ~40–60 px bar tracks at 640–800 px | 2 cols at 640–899 px, 3 cols only at **≥900 px** | Bars unreadable at 640 px; no content change |
| P1-10 | `app/globals.css` | `@media (min-width: 640px) .two-col` | 2 cols from 640 px → ~300 px GDD/Soil cards | Move `.two-col` to **≥900 px** | Soil source string + GDD lines squeeze at 640 px |
| P1-11 | `app/globals.css` | `.picker button` | No declared touch target; `0.7rem 0.5rem` padding | `min-height: 56px`; below 640 px `padding: 0.7rem 0.35rem` | 4 districts × 2 lines (EN + Urdu) at 320 px need a guaranteed 44 px+ target with slack |
| P1-12 | `docs/deck.html` | Slide 4 `tr.winner td` | `#fdf3d7` bg **1.11:1** vs white | `#fbeeb8` + `border-left: 4px solid #7a5c0e` (**6.24:1**); keep "★ Recommended" text | Winner row invisible in print/projector except for bold text |
| P1-13 | `docs/deck.html` | `@media print` only | No small-screen rule; 6-col table + 84 px hero overflow <640 px | Add `@media (max-width: 640px)` block: slide padding `28px 20px`, hero `56px`, table `14px` + `display: block; overflow-x: auto` | Deck must survive a phone / narrow projector window, not just print |

### P2 — nice to have (polish, no judge-blocking impact)

| ID | File | Location | Current | Proposed | Why |
|---|---|---|---|---|---|
| P2-1 | `app/globals.css` | `.fine-print { color: #5f6f66; }` | 5.31:1 white / 4.98:1 page — passes, thin margin | Optional: `#4f5e55` (**6.85:1** white, **6.42:1** page) for `.fine-print` only | More headroom at 0.82rem small text; not a failure, do not prioritise over P0/P1 |
| P2-2 | `app/globals.css` | `.bar-track` `#e6ebe7` on white (1.21:1); `.notice.warn` border `#e0a3a0` (2.12:1); `--line` `#d9e2db` (1.32:1) | Decorative borders/tracks below 3:1 | Leave as-is (meaning is carried by fills/text, which pass); do not darken decoratively — it would add visual noise for no AA gain | These are decorative, not meaningful indicators; WCAG 1.4.11 does not require 3:1 for pure decoration |
| P2-3 | `app/globals.css` | `.shift-hero .hero-number` | `3.4rem` / `4.2rem`, no clamp | `clamp(2.8rem, 11vw, 4.2rem)` | Protects 2-digit shifts (e.g. Lahore +12) at 320 px |
| P2-4 | `components/LiveDataPanel.tsx` + `globals.css` | `table.live-table td.missing`; `<th>` | Missing text `nowrap` forces table wide; `<th>` lacks `scope="col"` | `td.missing { white-space: normal; }`; add `scope="col"` to all four `<th>` | Table already scrolls correctly via `.table-wrap`; this keeps the Date column legible on 320 px |
| P2-5 | `app/globals.css` | `.rotation-grid` | Badge protrudes 12 px into a 14.4 px gap | `margin-top: 0.75rem` on `.rotation-grid` | 2.4 px clearance looks cramped, risks overlap if the heading wraps in Urdu |
| P2-6 | `components/RotationCompare.tsx` | `.bar-fill` inner span | No `aria-hidden` on the fill span inside a `role="img"` track | Add `aria-hidden="true"` to `.bar-fill` | Avoids an empty element being announced |
| P2-7 | `components/ShiftCard.tsx` | `.trend-line` | Outside the `aria-live="polite"` hero div | Move inside the live region or add `aria-live="polite"` | Screen-reader users hear the p-value change on district switch |
| P2-8 | `app/layout.tsx` | Root layout | No `viewport` export | Add `export const viewport = { width: 'device-width', initialScale: 1 };` and verify on the live URL | Mobile scaling currently relies on the Next.js default |
| P2-9 | `docs/deck.html` | Slide 3 copy | "Recent median (2023–2025): June 18" | "Recent median onset (2023–2025): June 18" | Removes ambiguity (cache stores the median as the 2024-06-18 date); numbers unchanged |
| P2-10 | `docs/deck.html` | Slide 5 margins | Multan 8 days, Layyah 3 days | Re-run the app for Multan + Layyah before presenting; correct the slide to the app if either differs | Runtime-computed, not in `data/districts.json`, so unverified in this audit — not flagged as wrong |
| P2-11 | `app/sources/page.tsx` | (no table on this page) | Brief assumed a table overflow here; none exists | No fix. Do not add a table wrapper | URLs already handled by `word-break: break-all`; verified no overflow source |

---

## Appendix — what passed and should NOT be changed

- **Gold-on-green (6.63:1), white-on-green (11.08:1), tagline `#cfe3d4` (8.23:1), hero-sub `#d7e8dc` (8.69:1), hero-dates `#a9c6b2` (6.02:1)** — all pass AA normal. Do not darken the hero.
- **Ink-soft `#4a5750` (7.58:1 white) and grey `#5f6f66` (5.31:1 white)** — pass. Do not lighten.
- **Danger red `#9d0208` for "not significant" (7.83:1 on `#edf7ef`)** — passes and is the right signal; keep it bold and next to the hero.
- **`.table-wrap { overflow-x: auto; }`** — the correct mobile-table pattern; already present.
- **Picker 2-col on mobile, rotation 1-col on mobile** — correct direction; only the 640 px 3-col breakpoint is too early (P1-9).
- **Honest copy throughout** (p = 0.12 stated, NOT SMAP labelled, "No pilot users yet", −999 shown as "not yet published", heat cap labelled) — keep every one of these wordings; the audit asks only that they be *surfaced earlier* (P1-5), never softened or removed.
