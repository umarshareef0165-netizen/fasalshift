// lib/cmr.ts — NASA CMR granule metadata (public, no auth).
// Pure shaping helpers for the /api/nasa/cmr route. Metadata ONLY: the
// route returns the latest granule date + collection + a "metadata only, no
// processing pipeline" label. It never downloads a granule file (that needs
// an Earthdata login) and never invents a date: when CMR is unreachable a
// collection comes back available:false with a null date.
//
// Verified live Nov 14, 2026 (Faisalabad bbox 73.0,31.3,73.3,31.6):
// - HLSL30 (HLS Landsat 8–9): 23 granules Oct 2026, latest Oct 29, 2026.
// - ECO_L2T_LSTE (ECOSTRESS LST): 50+ granules Oct 2026, latest Oct 31, 2026.
// (An earlier note said "3 ECOSTRESS hits / HLS Oct 4" — that was stale:
// Oct 4 is an older HLS granule, not the latest, and ECOSTRESS returns
// dozens of granules in the window. Live values win; never hard-code them.)

export const CMR_BASE = 'https://cmr.earthdata.nasa.gov/search/granules.json';

/** Faisalabad bounding box: minLon,minLat,maxLon,maxLat. */
export const FAISALABAD_BBOX = '73.0,31.3,73.3,31.6';

/** Label carried on every CMR response — the honest scope of this feature. */
export const CMR_METADATA_ONLY_LABEL = 'metadata only, no processing pipeline';

export interface CmrCollection {
  shortName: string;
  displayName: string;
}

export const CMR_COLLECTIONS: CmrCollection[] = [
  { shortName: 'HLSL30', displayName: 'Landsat 8–9 (HLS)' },
  { shortName: 'ECO_L2T_LSTE', displayName: 'ECOSTRESS LST' },
];

export interface CmrGranule {
  /** YYYY-MM-DD of the granule's start time. */
  date: string;
  granuleId: string;
}

export interface CmrCollectionResult {
  shortName: string;
  displayName: string;
  available: boolean;
  /** Latest granule date (YYYY-MM-DD), or null when CMR gave nothing. */
  latestGranuleDate: string | null;
  latestGranuleId: string | null;
  /** Granules returned in the queried window (page_size cap applies). */
  granulesInWindow: number;
}

/** Build a CMR granule-search URL for one collection over the bbox. */
export function cmrGranuleUrl(
  shortName: string,
  bbox: string,
  startISO: string,
  endISO: string,
  pageSize = 5,
): string {
  const params = new URLSearchParams({
    short_name: shortName,
    bounding_box: bbox,
    temporal: `${startISO},${endISO}`,
    page_size: String(pageSize),
    sort_key: '-start_date',
  });
  return `${CMR_BASE}?${params.toString()}`;
}

interface CmrEntry {
  time_start?: unknown;
  producer_granule_id?: unknown;
  title?: unknown;
  id?: unknown;
}

function entryGranule(entry: CmrEntry): CmrGranule | null {
  if (!entry || typeof entry !== 'object') return null;
  const timeStart = entry.time_start;
  if (typeof timeStart !== 'string' || timeStart.length < 10) return null;
  const granuleId =
    typeof entry.producer_granule_id === 'string'
      ? entry.producer_granule_id
      : typeof entry.title === 'string'
        ? entry.title
        : typeof entry.id === 'string'
          ? entry.id
          : null;
  if (granuleId === null) return null;
  return { date: timeStart.slice(0, 10), granuleId };
}

/**
 * Latest granule in a CMR feed.entry array (max by time_start), or null
 * when the feed has no usable entries. Never invents a date.
 */
export function pickLatestGranule(entries: unknown): CmrGranule | null {
  if (!Array.isArray(entries)) return null;
  let latest: CmrGranule | null = null;
  for (const entry of entries) {
    const g = entryGranule(entry as CmrEntry);
    if (g === null) continue;
    if (latest === null || g.date > latest.date) latest = g;
  }
  return latest;
}

/** Shape one collection's CMR response (or failure) into the route payload. */
export function shapeCmrCollection(
  collection: CmrCollection,
  payload: unknown,
): CmrCollectionResult {
  const base = {
    shortName: collection.shortName,
    displayName: collection.displayName,
  };
  if (!payload || typeof payload !== 'object') {
    return { ...base, available: false, latestGranuleDate: null, latestGranuleId: null, granulesInWindow: 0 };
  }
  const entries = (payload as { feed?: { entry?: unknown } }).feed?.entry;
  const latest = pickLatestGranule(entries);
  return {
    ...base,
    available: latest !== null,
    latestGranuleDate: latest?.date ?? null,
    latestGranuleId: latest?.granuleId ?? null,
    granulesInWindow: Array.isArray(entries) ? entries.length : 0,
  };
}
