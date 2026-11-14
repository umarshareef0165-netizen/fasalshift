// Pure shift math for FasalShift — no fetching, no I/O.
// All functions treat `null` (NASA POWER -999) as missing, never as zero.

import type { DailyPoint } from "./nasa";

/** Day-of-year (1-based) for a YYYY-MM-DD date, leap-year aware. */
export function dayOfYear(dateIso: string): number {
  const [y, m, d] = dateIso.split("-").map(Number);
  const start = Date.UTC(y, 0, 0);
  const day = Date.UTC(y, m - 1, d);
  return Math.round((day - start) / 86_400_000);
}

function parseIso(dateIso: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateIso.split("-").map(Number);
  return { year, month, day };
}

/**
 * Monsoon onset: the first day D on/after June 1 that starts a 3-day window
 * (D, D+1, D+2 — three consecutive calendar days) whose rain sums to
 * >= 7.5 mm. A window only counts if all three days have non-null rain;
 * windows containing a missing day are skipped, never treated as zero rain.
 * Returns null when no qualifying window exists in the supplied days.
 */
export function monsoonOnset(
  days: DailyPoint[],
): { date: string; dayOfYear: number } | null {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const byDate = new Map(sorted.map((d) => [d.date, d]));

  for (const day of sorted) {
    const { year, month } = parseIso(day.date);
    if (month < 6) continue; // only on/after June 1
    // The 3-day window must sit inside the same calendar year.
    const d0 = day.date;
    const d1 = addDays(d0, 1);
    const d2 = addDays(d0, 2);
    if (parseIso(d2).year !== year) continue;
    const r0 = byDate.get(d0)?.rain;
    const r1 = byDate.get(d1)?.rain;
    const r2 = byDate.get(d2)?.rain;
    if (r0 === null || r0 === undefined) continue;
    if (r1 === null || r1 === undefined) continue;
    if (r2 === null || r2 === undefined) continue;
    if (r0 + r1 + r2 >= 7.5) {
      return { date: d0, dayOfYear: dayOfYear(d0) };
    }
  }
  return null;
}

function addDays(dateIso: string, n: number): string {
  const { year, month, day } = parseIso(dateIso);
  const t = Date.UTC(year, month - 1, day) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

// --- t-distribution p-value via the regularized incomplete beta function ---
// (Numerical Recipes betacf / betai). Used by olsTrend.

function betacf(a: number, b: number, x: number): number {
  const MAX_ITER = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function logGamma(z: number): number {
  // Lanczos approximation (g = 7, 9 coefficients).
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const zz = z - 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (zz + i);
  const t = zz + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/**
 * Ordinary least squares trend of ys on xs.
 * Returns the slope and a two-tailed t-test p-value for slope != 0.
 * pValue is always a finite number in [0, 1]: degenerate inputs (n < 3,
 * zero x-variance, NaN) yield slope 0 (or the computable slope) and
 * pValue 1 (no evidence); a perfect non-zero fit yields pValue 0.
 */
export function olsTrend(xs: number[], ys: number[]): { slope: number; pValue: number } {
  const n = Math.min(xs.length, ys.length);
  const clean = (v: number): boolean => typeof v === "number" && Number.isFinite(v);
  if (n < 2 || !xs.slice(0, n).every(clean) || !ys.slice(0, n).every(clean)) {
    return { slope: 0, pValue: 1 };
  }
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - meanX) ** 2;
    sxy += (x[i] - meanX) * (y[i] - meanY);
  }
  if (sxx === 0) return { slope: 0, pValue: 1 };
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  if (n < 3) return { slope, pValue: 1 }; // no residual degrees of freedom
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const r = y[i] - (intercept + slope * x[i]);
    sse += r * r;
  }
  const df = n - 2;
  if (sse === 0) {
    // Perfect fit: a non-zero slope is maximally significant.
    return { slope, pValue: slope === 0 ? 1 : 0 };
  }
  const s2 = sse / df;
  const se = Math.sqrt(s2 / sxx);
  if (se === 0 || !Number.isFinite(se)) {
    return { slope, pValue: slope === 0 ? 1 : 0 };
  }
  const t = slope / se;
  // Two-tailed p-value: I_{df/(df+t^2)}(df/2, 1/2).
  let p = betai(df / 2, 0.5, df / (df + t * t));
  if (!Number.isFinite(p)) p = 1;
  return { slope, pValue: Math.min(1, Math.max(0, p)) };
}

function yyyymmddToIso(key: string): string {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

/**
 * Rabi-season thermal summary for a date range (inclusive, YYYYMMDD).
 * - GDD = sum(max(T2M - baseTemp, 0)) over the whole range (default range
 *   Oct 15..Apr 15, base 5 °C). Null T2M days contribute 0 to the sum.
 * - heatDays = count of days with T2M > 32 °C in Mar 1..Apr 15 of the
 *   range's end year.
 * - missingPct = share of CALENDAR days in the range with no usable T2M
 *   (null in the data, or absent from `days` entirely), as a percentage.
 *   Callers must show "insufficient data" when missingPct > 10; the numbers
 *   are returned anyway so the UI can decide.
 */
export function gddSeason(
  days: DailyPoint[],
  startYYYYMMDD: string,
  endYYYYMMDD: string,
  baseTemp = 5,
): { gdd: number; heatDays: number; missingPct: number } {
  const start = yyyymmddToIso(startYYYYMMDD);
  const end = yyyymmddToIso(endYYYYMMDD);
  const endYear = parseIso(end).year;
  const mar1 = `${endYear}-03-01`;
  const apr15 = `${endYear}-04-15`;

  // Calendar-day count across a possible year boundary:
  const totalCalendar =
    Math.round(
      (Date.UTC(endYear, parseIso(end).month - 1, parseIso(end).day) -
        Date.UTC(
          parseIso(start).year,
          parseIso(start).month - 1,
          parseIso(start).day,
        )) /
        86_400_000,
    ) + 1;

  let gdd = 0;
  let heatDays = 0;
  let present = 0;
  for (const d of days) {
    if (d.date < start || d.date > end) continue;
    if (d.t2m === null) continue;
    present++;
    gdd += Math.max(d.t2m - baseTemp, 0);
    if (d.date >= mar1 && d.date <= apr15 && d.t2m > 32) heatDays++;
  }
  const missing = Math.max(0, totalCalendar - present);
  const missingPct = totalCalendar > 0 ? (missing / totalCalendar) * 100 : 100;
  return { gdd, heatDays, missingPct };
}
