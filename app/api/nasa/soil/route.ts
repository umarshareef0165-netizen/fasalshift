// GET /api/nasa/soil?lat=..&lon=..
// Latest soil moisture (0–1 cm) from the Open-Meteo archive (ERA5 reanalysis
// — NOT SMAP), with a 15-minute in-memory cache. Same failure contract as
// /api/nasa/power: HTTP 502 with { error, cached } — never fake data.

import { NextResponse } from "next/server";
import { fetchSoilMoisture, SOIL_SOURCE } from "../../../../lib/nasa";

export const dynamic = "force-dynamic";

const TTL_MS = 15 * 60 * 1000;

interface SoilResult {
  value: number | null;
  date: string | null;
  source: string;
}

interface CacheEntry {
  fetchedAt: number;
  soil: SoilResult;
}

const cache = new Map<string, CacheEntry>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latRaw = url.searchParams.get("lat");
  const lonRaw = url.searchParams.get("lon");

  const lat = latRaw === null ? NaN : Number(latRaw);
  const lon = lonRaw === null ? NaN : Number(lonRaw);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "invalid lat (need -90..90)" }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "invalid lon (need -180..180)" }, { status: 400 });
  }

  const key = `${lat}|${lon}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.fetchedAt < TTL_MS) {
    return NextResponse.json({
      source: SOIL_SOURCE,
      fetchedAt: new Date(hit.fetchedAt).toISOString(),
      soil: hit.soil,
    });
  }

  try {
    const soil = await fetchSoilMoisture(lat, lon);
    const fetchedAt = Date.now();
    cache.set(key, { fetchedAt, soil });
    return NextResponse.json({
      source: SOIL_SOURCE,
      fetchedAt: new Date(fetchedAt).toISOString(),
      soil,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upstream fetch failed";
    return NextResponse.json(
      {
        error: message,
        cached: hit
          ? { fetchedAt: new Date(hit.fetchedAt).toISOString(), soil: hit.soil }
          : null,
      },
      { status: 502 },
    );
  }
}
