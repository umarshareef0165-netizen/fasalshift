// fetch-cache.mjs — build data/districts.json from LIVE NASA POWER +
// Open-Meteo archive calls during the sprint. Plain Node, global fetch,
// zero dependencies.
//
// Per district: climatology, live14 (Oct 31–Nov 13 2026), soil, rabiDaily
// (Oct 15 2024–May 15 2025), GDD seasons 2004-05 and 2024-25 (the 2024-25
// season is sliced out of rabiDaily to save a call).
// Onsets: FULL 2004..2025 series for Faisalabad (hero number); 2004 +
// 2023/2024/2025 only for Lahore / Multan / Layyah (trend over n=4).
// Any failed call records nulls for that piece and logs the error —
// values are NEVER invented.
//
// Usage: node scripts/fetch-cache.mjs   (run from the project root)

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "data", "districts.json");

const POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point";
const CLIM_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const SOIL_SOURCE = "Open-Meteo archive (ERA5 reanalysis) — NOT SMAP";
const FILL = -999;

const DISTRICTS = [
  { id: "faisalabad", name: "Faisalabad", nameUrdu: "فیصل آباد", lat: 31.4504, lon: 73.135 },
  { id: "lahore", name: "Lahore", nameUrdu: "لاہور", lat: 31.5204, lon: 74.3587 },
  { id: "multan", name: "Multan", nameUrdu: "ملتان", lat: 30.1575, lon: 71.5249 },
  { id: "layyah", name: "Layyah", nameUrdu: "لیہ", lat: 30.9693, lon: 70.9407 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- helpers

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

// --- t-distribution p-value (Numerical Recipes betacf / betai) ---
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

/** Monsoon onset: first day on/after Jun 1 starting a 3-day window with
 *  rain sum >= 7.5 mm; windows with any null rain are skipped. */
function monsoonOnset(days) {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
  const byDate = new Map(sorted.map((d) => [d.date, d]));
  for (const day of sorted) {
    const month = Number(day.date.slice(5, 7));
    if (month < 6) continue;
    const d0 = day.date, d1 = addDays(d0, 1), d2 = addDays(d0, 2);
    if (Number(d2.slice(0, 4)) !== Number(d0.slice(0, 4))) continue;
    const r0 = byDate.get(d0)?.rain;
    const r1 = byDate.get(d1)?.rain;
    const r2 = byDate.get(d2)?.rain;
    if (r0 == null || r1 == null || r2 == null) continue;
    if (r0 + r1 + r2 >= 7.5) return { date: d0, dayOfYear: dayOfYear(d0) };
  }
  return null;
}

/** Rabi thermal summary; mirrors lib/shift gddSeason. */
function gddSeason(days, startYYYYMMDD, endYYYYMMDD, baseTemp = 5) {
  const start = ymdToIso(startYYYYMMDD);
  const end = ymdToIso(endYYYYMMDD);
  const endYear = Number(end.slice(0, 4));
  const mar1 = `${endYear}-03-01`;
  const apr15 = `${endYear}-04-15`;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const totalCalendar = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000) + 1;
  let gdd = 0, heatDays = 0, present = 0;
  for (const d of days) {
    if (d.date < start || d.date > end) continue;
    if (d.t2m === null) continue;
    present++;
    gdd += Math.max(d.t2m - baseTemp, 0);
    if (d.date >= mar1 && d.date <= apr15 && d.t2m > 32) heatDays++;
  }
  const missingPct = totalCalendar > 0
    ? (Math.max(0, totalCalendar - present) / totalCalendar) * 100 : 100;
  return { gdd, heatDays, missingPct };
}

// ---------------------------------------------------------------- fetching

let callCount = 0;

/** GET JSON with logging + up to 3 attempts. Returns parsed JSON or null. */
async function fetchJsonLogged(url, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    callCount++;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      console.log(`[${callCount}] ${label} -> HTTP ${res.status} (attempt ${attempt})`);
      if (!res.ok) {
        if (attempt < 3) { await sleep(2000 * attempt); continue; }
        console.error(`  FAIL ${label}: HTTP ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.log(`[${callCount}] ${label} -> ERROR ${err.message} (attempt ${attempt})`);
      if (attempt < 3) { await sleep(2000 * attempt); continue; }
      console.error(`  FAIL ${label}: ${err.message}`);
      return null;
    }
  }
  return null;
}

async function powerDaily(lat, lon, start, end, label) {
  const url = `${POWER_BASE}?parameters=T2M,PRECTOTCORR,WS2M&community=AG`
    + `&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const payload = await fetchJsonLogged(url, label);
  if (!payload?.properties?.parameter) return null;
  const p = payload.properties.parameter;
  const t2m = p.T2M ?? {}, rain = p.PRECTOTCORR ?? {}, ws2m = p.WS2M ?? {};
  return Object.keys(t2m).sort().map((k) => ({
    date: ymdToIso(k),
    t2m: toNull(t2m[k]),
    rain: toNull(rain[k]),
    ws2m: toNull(ws2m[k]),
  }));
}

async function climatology(lat, lon, label) {
  const url = `${CLIM_BASE}?parameters=T2M,PRECTOTCORR&community=AG`
    + `&longitude=${lon}&latitude=${lat}&format=JSON`;
  const payload = await fetchJsonLogged(url, label);
  if (!payload?.properties?.parameter) return null;
  const p = payload.properties.parameter;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANN"];
  const out = {};
  for (const m of months) {
    const t = toNull(p.T2M?.[m]);
    const r = toNull(p.PRECTOTCORR?.[m]);
    if (t === null || r === null) return null;
    out[m] = { t2m: t, rain: r };
  }
  return out;
}

async function soilMoisture(lat, lon, label) {
  // Last 3 days ending 2026-11-13 (matches live14 window).
  const url = `${OPEN_METEO_ARCHIVE}?latitude=${lat}&longitude=${lon}`
    + `&start_date=2026-11-10&end_date=2026-11-13`
    + `&hourly=soil_moisture_0_to_1cm&timezone=Asia%2FKarachi`;
  const payload = await fetchJsonLogged(url, label);
  const times = payload?.hourly?.time ?? [];
  const values = payload?.hourly?.soil_moisture_0_to_1cm ?? [];
  for (let i = times.length - 1; i >= 0; i--) {
    const v = values[i];
    if (typeof v === "number" && !Number.isNaN(v)) {
      return { value: v, date: times[i].slice(0, 10), source: SOIL_SOURCE };
    }
  }
  return { value: null, date: null, source: SOIL_SOURCE };
}

// ---------------------------------------------------------------- main

async function buildDistrict(d) {
  console.log(`\n=== ${d.name} (${d.lat}, ${d.lon}) ===`);
  const isHero = d.id === "faisalabad";
  const onsetYears = isHero
    ? Array.from({ length: 22 }, (_, i) => 2004 + i)
    : [2004, 2023, 2024, 2025];

  // --- onsets ---
  const onsets = [];
  for (const year of onsetYears) {
    const days = await powerDaily(
      d.lat, d.lon, `${year}0601`, `${year}0930`, `${d.id} onset ${year}`,
    );
    await sleep(250);
    if (!days) {
      console.error(`  onset ${year}: no data -> null`);
      onsets.push({ year, date: null, dayOfYear: null });
      continue;
    }
    const o = monsoonOnset(days);
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

  // --- GDD seasons ---
  const season2004Days = await powerDaily(
    d.lat, d.lon, "20041015", "20050415", `${d.id} GDD 2004-05`,
  );
  await sleep(250);
  const gdd2004 = season2004Days
    ? gddSeason(season2004Days, "20041015", "20050415")
    : { gdd: 0, heatDays: 0, missingPct: 100 };
  if (!season2004Days) console.error("  GDD 2004-05: no data");

  // --- rabiDaily (also the source for the 2024-25 GDD season) ---
  const rabiDailyFull = await powerDaily(
    d.lat, d.lon, "20241015", "20250515", `${d.id} rabiDaily`,
  );
  await sleep(250);
  const rabiDaily = (rabiDailyFull ?? []).map(({ date, t2m, rain }) => ({ date, t2m, rain }));
  const gddRecent = rabiDailyFull
    ? gddSeason(rabiDailyFull, "20241015", "20250415")
    : { gdd: 0, heatDays: 0, missingPct: 100 };
  if (!rabiDailyFull) console.error("  rabiDaily: no data");

  // --- climatology ---
  const clim = await climatology(d.lat, d.lon, `${d.id} climatology`);
  await sleep(250);
  if (!clim) console.error("  climatology: no data");

  // --- live14 (last 14 days ending 2026-11-13) ---
  const live14 = await powerDaily(d.lat, d.lon, "20261031", "20261113", `${d.id} live14`);
  await sleep(250);
  if (!live14) console.error("  live14: no data");

  // --- soil ---
  const soil = await soilMoisture(d.lat, d.lon, `${d.id} soil`);
  await sleep(250);

  return {
    name: d.name,
    nameUrdu: d.nameUrdu,
    lat: d.lat,
    lon: d.lon,
    onset2004: { date: onset2004.date, dayOfYear: onset2004.dayOfYear },
    onsetRecent,
    shiftDays,
    trend,
    onsets,
    gdd: { season2004: gdd2004, seasonRecent: gddRecent },
    climatology: clim,
    live14: live14 ?? [],
    soil,
    rabiDaily,
  };
}

async function main() {
  const districts = {};
  for (const d of DISTRICTS) {
    districts[d.id] = await buildDistrict(d);
  }
  const out = {
    generatedAt: new Date().toISOString(),
    source: "NASA POWER Daily + Climatology APIs (live calls during sprint)",
    districts,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWROTE ${OUT_PATH} (${callCount} API calls)`);
  for (const d of DISTRICTS) {
    const r = districts[d.id];
    console.log(
      `${d.id}: shiftDays=${r.shiftDays} trend slope=${r.trend.slopePerYear.toFixed(4)}/yr ` +
      `p=${r.trend.pValue.toFixed(4)} n=${r.trend.n} ` +
      `onset2004=${r.onset2004.date} onsetRecent=${r.onsetRecent.date} (DOY ${r.onsetRecent.dayOfYear})`,
    );
  }
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
