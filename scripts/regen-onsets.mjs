// regen-onsets.mjs — M4 (WIN-STRATEGY, Nov 14, 2026).
// Root cause: scripts/fetch-cache.mjs only fetched onsets for 2004 + 2023/24/25
// for Lahore / Multan / Layyah (a generation gap, not real data), so their
// trends rested on n = 4. This script regenerates the FULL 2004–2025 onset
// series for those three districts from LIVE NASA POWER with ONE daily-point
// call per district for the whole range (20040601–20250930), then rebuilds
// data/districts.json: only onsets / onset2004 / onsetRecent / shiftDays /
// trend change for the three districts. Faisalabad is left byte-identical
// (its n = 22 series is already verified). Nothing else in the file moves.
//
// Usage: node scripts/regen-onsets.mjs   (run from the project root)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "data", "districts.json");

const POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point";
const FILL = -999;

const DISTRICTS = [
  { id: "lahore", name: "Lahore", lat: 31.5204, lon: 74.3587 },
  { id: "multan", name: "Multan", lat: 30.1575, lon: 71.5249 },
  { id: "layyah", name: "Layyah", lat: 30.9693, lon: 70.9407 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toNull(v) {
  return typeof v === "number" && !Number.isNaN(v) && v !== FILL ? v : null;
}

function ymdToIso(key) {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

function dayOfYear(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
}

function addDays(dateIso, n) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10);
}

function median(nums) {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// --- t-distribution p-value (Numerical Recipes betacf / betai) —
// identical to scripts/fetch-cache.mjs, so trend numbers stay comparable.
function betacf(a, b, x) {
  const MAX_ITER = 200, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function logGamma(z) {
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const zz = z - 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (zz + i);
  const t = zz + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)
    + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function ols(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, pValue: 1 };
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0) return { slope: 0, pValue: 1 };
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  if (n < 3) return { slope, pValue: 1 };
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const r = ys[i] - (intercept + slope * xs[i]);
    sse += r * r;
  }
  const df = n - 2;
  if (sse === 0) return { slope, pValue: slope === 0 ? 1 : 0 };
  const se = Math.sqrt(sse / df / sxx);
  if (se === 0 || !Number.isFinite(se)) return { slope, pValue: slope === 0 ? 1 : 0 };
  const t = slope / se;
  let p = betai(df / 2, 0.5, df / (df + t * t));
  if (!Number.isFinite(p)) p = 1;
  return { slope, pValue: Math.min(1, Math.max(0, p)) };
}

/** Monsoon onset for ONE year: first day on/after Jun 1 starting a 3-day
 *  window with rain sum >= 7.5 mm; windows with any null rain are skipped.
 *  Same rule as fetch-cache.mjs / docs/ROTATION-SCORING.md. */
function monsoonOnset(days, year) {
  const yearDays = days.filter((d) => Number(d.date.slice(0, 4)) === year);
  const byDate = new Map(yearDays.map((d) => [d.date, d]));
  for (const day of yearDays) {
    const month = Number(day.date.slice(5, 7));
    if (month < 6) continue;
    const d0 = day.date, d1 = addDays(d0, 1), d2 = addDays(d0, 2);
    if (Number(d2.slice(0, 4)) !== year) continue;
    const r0 = byDate.get(d0)?.rain;
    const r1 = byDate.get(d1)?.rain;
    const r2 = byDate.get(d2)?.rain;
    if (r0 == null || r1 == null || r2 == null) continue;
    if (r0 + r1 + r2 >= 7.5) return { date: d0, dayOfYear: dayOfYear(d0) };
  }
  return null;
}

async function powerDailyRange(lat, lon, start, end, label) {
  const url = `${POWER_BASE}?parameters=T2M,PRECTOTCORR,WS2M&community=AG`
    + `&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      console.log(`  ${label} -> HTTP ${res.status} (attempt ${attempt})`);
      if (!res.ok) {
        if (attempt < 3) { await sleep(2000 * attempt); continue; }
        return null;
      }
      const payload = await res.json();
      if (!payload?.properties?.parameter) return null;
      const p = payload.properties.parameter;
      const t2m = p.T2M ?? {}, rain = p.PRECTOTCORR ?? {}, ws2m = p.WS2M ?? {};
      return Object.keys(t2m).sort().map((k) => ({
        date: ymdToIso(k),
        t2m: toNull(t2m[k]),
        rain: toNull(rain[k]),
        ws2m: toNull(ws2m[k]),
      }));
    } catch (err) {
      console.log(`  ${label} -> ERROR ${err.message} (attempt ${attempt})`);
      if (attempt < 3) { await sleep(2000 * attempt); continue; }
      return null;
    }
  }
  return null;
}

async function main() {
  const cache = JSON.parse(readFileSync(OUT_PATH, "utf8"));
  const before = JSON.stringify(cache.districts.faisalabad);

  for (const d of DISTRICTS) {
    console.log(`\n=== ${d.name} (${d.lat}, ${d.lon}) ===`);
    // ONE call for the full 2004–2025 range.
    const days = await powerDailyRange(d.lat, d.lon, "20040601", "20250930", `${d.id} 2004-2025`);
    await sleep(500);
    if (!days) {
      console.error(`  FATAL: no data for ${d.id} — leaving districts.json UNCHANGED for this district`);
      continue;
    }
    console.log(`  fetched ${days.length} days (${days[0].date}..${days[days.length - 1].date})`);

    const onsets = [];
    for (let year = 2004; year <= 2025; year++) {
      const o = monsoonOnset(days, year);
      onsets.push({ year, date: o?.date ?? null, dayOfYear: o?.dayOfYear ?? null });
      console.log(`  onset ${year}: ${o ? `${o.date} (DOY ${o.dayOfYear})` : "none found"}`);
    }

    const onset2004 = onsets.find((o) => o.year === 2004) ?? { date: null, dayOfYear: null };
    const recent = onsets.filter((o) => [2023, 2024, 2025].includes(o.year) && o.dayOfYear !== null);
    let onsetRecent = { date: null, dayOfYear: null, years: [2023, 2024, 2025] };
    if (recent.length > 0) {
      const med = median(recent.map((o) => o.dayOfYear));
      const sorted = [...recent].sort((a, b) => a.dayOfYear - b.dayOfYear);
      const mid = sorted[Math.floor(sorted.length / 2)];
      onsetRecent = {
        date: sorted.length % 2 === 1 ? mid.date : null,
        dayOfYear: med,
        years: [2023, 2024, 2025],
      };
    }
    const shiftDays = onset2004.dayOfYear !== null && onsetRecent.dayOfYear !== null
      ? onsetRecent.dayOfYear - onset2004.dayOfYear
      : null;

    const found = onsets.filter((o) => o.dayOfYear !== null);
    const t = ols(found.map((o) => o.year), found.map((o) => o.dayOfYear));
    const trend = { slopePerYear: t.slope, pValue: t.pValue, n: found.length };

    const rec = cache.districts[d.id];
    rec.onsets = onsets;
    rec.onset2004 = { date: onset2004.date, dayOfYear: onset2004.dayOfYear };
    rec.onsetRecent = onsetRecent;
    rec.shiftDays = shiftDays;
    rec.trend = trend;
    console.log(
      `  => shiftDays=${shiftDays} trend slope=${t.slope.toFixed(4)}/yr ` +
      `p=${t.pValue.toFixed(4)} n=${found.length} ` +
      `onset2004=${onset2004.date} onsetRecent DOY=${onsetRecent.dayOfYear}`,
    );
  }

  // Safety: Faisalabad must be untouched.
  if (JSON.stringify(cache.districts.faisalabad) !== before) {
    console.error("FATAL: Faisalabad record changed — refusing to write");
    process.exit(1);
  }
  cache.generatedAt = new Date().toISOString();
  cache.source =
    "NASA POWER Daily + Climatology APIs (live calls during sprint); " +
    "Lahore/Multan/Layyah onsets regenerated 2004–2025 via scripts/regen-onsets.mjs (one POWER call per district)";
  writeFileSync(OUT_PATH, JSON.stringify(cache, null, 2) + "\n");
  console.log(`\nWROTE ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
