import { describe, it, expect } from "vitest";
import { monsoonOnset, olsTrend, gddSeason, dayOfYear } from "../lib/shift";
import type { DailyPoint } from "../lib/nasa";

function days(
  entries: Array<[string, number | null, (number | null)?]>,
): DailyPoint[] {
  // entries: [date, rain, t2m?]
  return entries.map(([date, rain, t2m]) => ({
    date,
    t2m: t2m === undefined ? null : t2m,
    rain,
    ws2m: null,
  }));
}

describe("monsoonOnset", () => {
  it("finds onset with a 3-day 7.5mm window", () => {
    const d = days([
      ["2024-06-01", 0],
      ["2024-06-02", 0],
      ["2024-06-03", 2],
      ["2024-06-04", 3],
      ["2024-06-05", 3],
      ["2024-06-06", 0],
    ]);
    const onset = monsoonOnset(d);
    // Windows: Jun1-3 = 2, Jun2-4 = 5, Jun3-5 = 8 >= 7.5 -> onset Jun 3.
    expect(onset).not.toBeNull();
    expect(onset!.date).toBe("2024-06-03");
    // 2024 is a leap year: Jan31+Feb29+Mar31+Apr30+May31 = 152, +3 = 155.
    expect(onset!.dayOfYear).toBe(155);
    expect(dayOfYear("2024-06-03")).toBe(155);
  });

  it("triggers on exactly 7.5mm over 3 days", () => {
    const d = days([
      ["2024-06-01", 2.5],
      ["2024-06-02", 2.5],
      ["2024-06-03", 2.5],
    ]);
    expect(monsoonOnset(d)?.date).toBe("2024-06-01");
  });

  it("returns null when no qualifying window exists", () => {
    const d = days([
      ["2024-06-01", 1],
      ["2024-06-02", 2],
      ["2024-06-03", 1],
      ["2024-06-04", 2],
      ["2024-06-05", 1],
      ["2024-06-06", 0],
    ]);
    expect(monsoonOnset(d)).toBeNull();
  });

  it("skips windows containing null (-999) rain days instead of treating them as zero", () => {
    // If null were treated as 0, Jun1-3 would sum 8+0+0 = 8 and trigger.
    // Correct behaviour: the Jun1 window is unverifiable, so no onset here.
    const d = days([
      ["2024-06-01", 8],
      ["2024-06-02", null],
      ["2024-06-03", 0],
      ["2024-06-04", 0],
      ["2024-06-05", 0],
      ["2024-06-06", 0],
    ]);
    expect(monsoonOnset(d)).toBeNull();
  });

  it("still finds a later valid window after null days", () => {
    const d = days([
      ["2024-06-01", 8],
      ["2024-06-02", null],
      ["2024-06-03", 0],
      ["2024-06-04", 3],
      ["2024-06-05", 3],
      ["2024-06-06", 3],
    ]);
    // Jun3-5 = 0+3+3 = 6 (no); Jun4-6 = 9 >= 7.5 -> onset Jun 4.
    expect(monsoonOnset(d)?.date).toBe("2024-06-04");
  });

  it("ignores rain before June 1", () => {
    const d = days([
      ["2024-05-30", 5],
      ["2024-05-31", 5],
      ["2024-06-01", 0],
      ["2024-06-02", 0],
      ["2024-06-03", 0],
    ]);
    expect(monsoonOnset(d)).toBeNull();
  });
});

describe("gddSeason", () => {
  it("computes GDD on a hand-computed 3-day example", () => {
    // Oct 15: T2M 10 -> max(10-5,0) = 5
    // Oct 16: T2M 4  -> max(4-5,0)  = 0
    // Oct 17: T2M 20 -> max(20-5,0) = 15
    // Total GDD = 20, no heat days (October), no missing days.
    const d = days([
      ["2024-10-15", 0, 10],
      ["2024-10-16", 0, 4],
      ["2024-10-17", 0, 20],
    ]);
    const r = gddSeason(d, "20241015", "20241017");
    expect(r.gdd).toBe(20);
    expect(r.heatDays).toBe(0);
    expect(r.missingPct).toBe(0);
  });

  it("counts heat days only Mar 1..Apr 15 and reports missing share", () => {
    const d = days([
      ["2025-02-28", 0, 35], // >32 but before Mar 1: not a heat day
      ["2025-03-01", 0, 33], // heat day 1
      ["2025-03-02", 0, 32], // exactly 32: not >32
      ["2025-03-03", 0, null], // missing
      ["2025-03-04", 0, 34], // heat day 2
    ]);
    const r = gddSeason(d, "20250228", "20250304");
    expect(r.heatDays).toBe(2);
    // 5 calendar days, 1 missing (Mar 3 null) -> 20%.
    expect(r.missingPct).toBeCloseTo(20, 9);
    // GDD: 30+28+27+0+29 = 114.
    expect(r.gdd).toBe(114);
  });

  it("counts days absent from the array as missing", () => {
    const d = days([
      ["2024-10-15", 0, 10],
      ["2024-10-17", 0, 10], // Oct 16 absent entirely
    ]);
    const r = gddSeason(d, "20241015", "20241017");
    expect(r.missingPct).toBeCloseTo(100 / 3, 9);
    expect(r.gdd).toBe(10);
  });
});

describe("olsTrend", () => {
  it("recovers the exact slope of a known linear series", () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = [2, 4, 6, 8, 10]; // y = 2x + 2
    const { slope, pValue } = olsTrend(xs, ys);
    expect(slope).toBeCloseTo(2, 9);
    expect(pValue).toBe(0); // perfect fit, non-zero slope
  });

  it("recovers an approximate slope on a noisy series with pValue in [0,1]", () => {
    const xs = [2004, 2005, 2006, 2007, 2008, 2009, 2010];
    const ys = [160, 161.5, 161, 163, 163.5, 164, 165.5]; // ~+0.8/yr
    const { slope, pValue } = olsTrend(xs, ys);
    expect(slope).toBeGreaterThan(0.5);
    expect(slope).toBeLessThan(1.1);
    expect(pValue).toBeGreaterThanOrEqual(0);
    expect(pValue).toBeLessThanOrEqual(1);
    expect(pValue).toBeLessThan(0.05); // clearly significant trend
  });

  it("returns slope 0 and pValue 1 for a flat series", () => {
    const { slope, pValue } = olsTrend([1, 2, 3, 4], [5, 5, 5, 5]);
    expect(slope).toBe(0);
    expect(pValue).toBe(1);
  });

  it("is NaN-safe on degenerate input", () => {
    for (const bad of [
      olsTrend([], []),
      olsTrend([1], [2]),
      olsTrend([1, 1, 1], [2, 3, 4]),
      olsTrend([1, 2, 3], [NaN, 2, 3]),
    ]) {
      expect(Number.isFinite(bad.slope)).toBe(true);
      expect(Number.isFinite(bad.pValue)).toBe(true);
      expect(bad.pValue).toBeGreaterThanOrEqual(0);
      expect(bad.pValue).toBeLessThanOrEqual(1);
    }
  });
});
