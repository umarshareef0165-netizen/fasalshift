// GET /api/nasa/cmr — latest NASA CMR granule metadata over Faisalabad.
// Public, no auth. Metadata ONLY (latest granule date + collection +
// "metadata only, no processing pipeline" label) — no file downloads, no
// processing pipeline. On upstream failure: HTTP 502 with
// { error, available: false } — the UI degrades to a labelled "unavailable"
// state and never shows a fake date.

import { NextResponse } from 'next/server';
import {
  CMR_COLLECTIONS,
  CMR_METADATA_ONLY_LABEL,
  FAISALABAD_BBOX,
  cmrGranuleUrl,
  shapeCmrCollection,
  type CmrCollectionResult,
} from '../../../../lib/cmr';

export const dynamic = 'force-dynamic';

/** Granule metadata changes slowly; cache the shaped response 1 hour. */
const TTL_MS = 60 * 60 * 1000;

let cached: { fetchedAt: number; body: unknown } | null = null;

/** Look back 45 days from today (UTC) for recent granules. */
function windowISO(now: Date): { start: string; end: string } {
  const end = now.toISOString();
  const start = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

async function fetchCollection(
  shortName: string,
  start: string,
  end: string,
): Promise<unknown | null> {
  try {
    const res = await fetch(cmrGranuleUrl(shortName, FAISALABAD_BBOX, start, end), {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return NextResponse.json(cached.body);
  }

  const { start, end } = windowISO(new Date(now));
  const results: CmrCollectionResult[] = [];
  for (const collection of CMR_COLLECTIONS) {
    const payload = await fetchCollection(collection.shortName, start, end);
    results.push(shapeCmrCollection(collection, payload));
  }

  const anyAvailable = results.some((r) => r.available);
  if (!anyAvailable) {
    return NextResponse.json(
      {
        error: 'NASA CMR unreachable',
        available: false,
        source: 'NASA CMR',
        label: CMR_METADATA_ONLY_LABEL,
        collections: results,
      },
      { status: 502 },
    );
  }

  const body = {
    source: 'NASA CMR',
    fetchedAt: new Date(now).toISOString(),
    area: 'Faisalabad',
    available: true,
    label: CMR_METADATA_ONLY_LABEL,
    collections: results,
  };
  cached = { fetchedAt: now, body };
  return NextResponse.json(body);
}
