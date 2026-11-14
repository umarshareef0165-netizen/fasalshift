# FasalShift — 30-second demo video script

**Rule:** record the LIVE app only (live Vercel URL). Never record a mock-up and
present it as live. Record in English on screen; Urdu voiceover with English
subtitles (the app's voice summary speaks Urdu). Keep the whole video ≤ 30 s.
The recording itself is the user's step — this script + the live app are ready.

## Shot list

| Time | Shot (what the camera shows) | Voiceover (Urdu) | On-screen text |
|---|---|---|---|
| 0–5s | Farmer's field (or the app's problem line on the home page). One line, one image. | "مون سون بدل گیا ہے، مٹی تھک گئی ہے — کسان کو فیصلہ چاہیے۔" (The monsoon has shifted, the soil is tired — the farmer needs a decision.) | "What do I plant after wheat — and when?" |
| 5–15s | Click **Faisalabad** → live NASA data loads → Shift hero appears. | "ناسا کے ڈیٹا سے دیکھیں — بڑھوتری کا موسم دو دن پیچھے ہو گیا ہے۔" (See from NASA data — the growing window moved 2 days later.) | "Growing window shifted +2 days · grain-fill heat days 0 → 5 · NASA POWER, live" |
| 15–25s | Three rotations side by side → Wheat → Pulses highlights as Recommended (7.2). | "گندم کے بعد دالیں بہترین ہیں — پانی بچتا ہے، مٹی صحت مند ہوتی ہے۔" (After wheat, pulses are best — water is saved, soil recovers.) | "Wheat → Pulses 7.2 ★ · Cotton 6.2 · Maize 6.0" |
| 25–30s | Tap the Urdu voice summary (it speaks) → "Built on NASA open data" + repo link on screen. | "فصل شفٹ — ناسا کے کھلے ڈیٹا پر بنا۔" (FasalShift — built on NASA open data.) Then, in English: "The monsoon moved 2 days. You have 2 days." Then: "FasalShift — built on NASA open data." | "FasalShift · Live app URL · GitHub repo" |

## Numbers to show (all real, from the live cache — do not change)

- Shift: **+2 days** (Faisalabad; onset 2004 Jun 16 → recent median Jun 18)
- Trend: **−0.54 days/year, p = 0.12 — not significant** (do NOT show a trend claim; if the trend is mentioned, say "not statistically significant")
- Heat days: **0 → 5** (grain fill, 2004-05 → 2024-25); GDD **2,416 → 2,681**
- Rotation winner: **Wheat → Pulses 7.2** (Cotton 6.2, Maize 6.0)
- Adaptation Margin (Faisalabad): **2 days** (all three rotations)
- Soil: **0.156 m³/m³** — label on screen "Open-Meteo/ERA5 — NOT SMAP" if shown

## Checklist before recording

- [ ] Live Vercel URL opens with zero errors; district picker works
- [ ] Faisalabad selected by default; Shift hero shows +2 days
- [ ] Rotation cards show Pulses highlighted as Recommended
- [ ] Voice summary speaks Urdu (check `speechSynthesis` in the recording browser)
- [ ] Timer running — cut at 30 s, no longer
- [ ] English subtitles burned in for the whole video, including the 25–30 s closing lines ("The monsoon moved 2 days. You have 2 days." / "FasalShift — built on NASA open data.")
- [ ] End card shows the live URL + repo URL (both must be real by recording time)
