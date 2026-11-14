// GET /api/nasa/power?lat=..&lon=..&start=YYYYMMDD&end=YYYYMMDD
// Proxies the NASA POWER daily API with a 15-minute in-memory cache.
// -999 fill values are stripped to null by the client (lib/nasa).
// On upstream failure: HTTP 502 with { error, cached } — stale cache if any,
// never fake data.

import { NextResponse } from "next/server";
import { fetchPowerDaily, type DailyPoint } from "../../../../lib/nasa";

export const dynamic = "force-dynamic";

const TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  days: DailyPoint[];
}

const cache = new Map<string, CacheEntry>();

function isValidDateRange(s: string | null): s is string {
  return s !== null && /^\d{8}$/.test(s);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latRaw = url.searchParams.get("lat");
  const lonRaw = url.searchParams.get("lon");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  const lat = latRaw === null ? NaN : Number(latRaw);
  const lon = lonRaw === null ? NaN : Number(lonRaw);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "invalid lat (need -90..90)" }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "invalid lon (need -180..180)" }, { status: 400 });
  }
  if (!isValidDateRange(start) || !isValidDateRange(end)) {
    return NextResponse.json(
      { error: "invalid start/end (need YYYYMMDD)" },
      { status: 400 },
    );
  }
  if (start > end) {
    return NextResponse.json({ error: "start must be <= end" }, { status: 400 });
  }

  const key = `${lat}|${lon}|${start}|${end}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.fetchedAt < TTL_MS) {
    return NextResponse.json({
      source: "NASA POWER",
      fetchedAt: new Date(hit.fetchedAt).toISOString(),
      days: hit.days,
    });
  }

  try {
    const days = await fetchPowerDaily(lat, lon, start, end);
    const fetchedAt = Date.now();
    cache.set(key, { fetchedAt, days });
    return NextResponse.json({
      source: "NASA POWER",
      fetchedAt: new Date(fetchedAt).toISOString(),
      days,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upstream fetch failed";
    return NextResponse.json(
      {
        error: message,
        cached: hit
          ? { fetchedAt: new Date(hit.fetchedAt).toISOString(), days: hit.days }
          : null,
      },
      { status: 502 },
    );
  }
}
