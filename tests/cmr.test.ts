import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CMR_METADATA_ONLY_LABEL,
  cmrGranuleUrl,
  pickLatestGranule,
  shapeCmrCollection,
} from '../lib/cmr';
// NOTE: the route module holds a 1-hour in-memory cache, so each route test
// below re-imports it fresh via vi.resetModules() — otherwise the first
// test's cached 200 would mask the second test's 502.

const HLS = { shortName: 'HLSL30', displayName: 'Landsat 8–9 (HLS)' };

function cmrFeed(entries: unknown[]) {
  return { feed: { entry: entries } };
}

describe('pickLatestGranule', () => {
  it('returns the latest granule by time_start', () => {
    const latest = pickLatestGranule([
      { time_start: '2026-10-04T05:42:48.000Z', producer_granule_id: 'HLS.old' },
      { time_start: '2026-10-29T05:36:41.495Z', producer_granule_id: 'HLS.L30.T43RBQ.2026302T053641.v2.0' },
      { time_start: '2026-10-21T05:36:42.000Z', producer_granule_id: 'HLS.mid' },
    ]);
    expect(latest).toEqual({
      date: '2026-10-29',
      granuleId: 'HLS.L30.T43RBQ.2026302T053641.v2.0',
    });
  });

  it('returns null for an empty feed, a missing feed, or unusable entries', () => {
    expect(pickLatestGranule([])).toBeNull();
    expect(pickLatestGranule(undefined)).toBeNull();
    expect(pickLatestGranule(null)).toBeNull();
    expect(pickLatestGranule([{ time_start: 'not-a-date' }])).toBeNull();
    expect(pickLatestGranule([{ producer_granule_id: 'no-time' }])).toBeNull();
  });

  it('falls back to title/id when producer_granule_id is absent', () => {
    expect(
      pickLatestGranule([{ time_start: '2026-10-31T01:44:14.084Z', title: 'ECO.fallback' }]),
    ).toEqual({ date: '2026-10-31', granuleId: 'ECO.fallback' });
  });
});

describe('shapeCmrCollection', () => {
  it('shapes a live feed into an available result with the latest date', () => {
    const result = shapeCmrCollection(
      HLS,
      cmrFeed([
        { time_start: '2026-10-29T05:36:41.495Z', producer_granule_id: 'HLS.new' },
        { time_start: '2026-10-04T05:42:48.000Z', producer_granule_id: 'HLS.old' },
      ]),
    );
    expect(result.available).toBe(true);
    expect(result.latestGranuleDate).toBe('2026-10-29');
    expect(result.latestGranuleId).toBe('HLS.new');
    expect(result.granulesInWindow).toBe(2);
  });

  it('marks an empty or failed payload unavailable with a null date — never a fake date', () => {
    for (const bad of [null, undefined, {}, { feed: {} }, cmrFeed([])]) {
      const result = shapeCmrCollection(HLS, bad);
      expect(result.available).toBe(false);
      expect(result.latestGranuleDate).toBeNull();
      expect(result.latestGranuleId).toBeNull();
    }
  });
});

describe('cmrGranuleUrl', () => {
  it('queries the right collection, bbox and window, newest first', () => {
    const url = cmrGranuleUrl(
      'ECO_L2T_LSTE',
      '73.0,31.3,73.3,31.6',
      '2026-09-30T00:00:00.000Z',
      '2026-11-14T00:00:00.000Z',
    );
    expect(url).toContain('cmr.earthdata.nasa.gov/search/granules.json');
    expect(url).toContain('short_name=ECO_L2T_LSTE');
    expect(url).toContain('bounding_box=73.0%2C31.3%2C73.3%2C31.6');
    expect(url).toContain('sort_key=-start_date');
  });
});

describe('GET /api/nasa/cmr (mocked CMR fetch)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the latest granule date per collection + the metadata-only label', async () => {
    vi.resetModules();
    const { GET } = await import('../app/api/nasa/cmr/route');
    const fetchMock = vi.fn(async (url: string) => {
      const isEco = url.includes('ECO_L2T_LSTE');
      const entries = isEco
        ? [{ time_start: '2026-10-31T01:44:14.084Z', producer_granule_id: 'ECO.new' }]
        : [{ time_start: '2026-10-29T05:36:41.495Z', producer_granule_id: 'HLS.new' }];
      return { ok: true, json: async () => cmrFeed(entries) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      source: string;
      available: boolean;
      label: string;
      collections: { shortName: string; latestGranuleDate: string | null; available: boolean }[];
    };
    expect(body.source).toBe('NASA CMR');
    expect(body.available).toBe(true);
    expect(body.label).toBe(CMR_METADATA_ONLY_LABEL);
    expect(body.collections.find((c) => c.shortName === 'HLSL30')?.latestGranuleDate).toBe(
      '2026-10-29',
    );
    expect(body.collections.find((c) => c.shortName === 'ECO_L2T_LSTE')?.latestGranuleDate).toBe(
      '2026-10-31',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns 502 with available:false when CMR is unreachable — never a fake date', async () => {
    vi.resetModules();
    const { GET } = await import('../app/api/nasa/cmr/route');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response));
    const res = await GET();
    expect(res.status).toBe(502);
    const body = (await res.json()) as { available: boolean; error: string };
    expect(body.available).toBe(false);
    expect(body.error).toBeTruthy();
  });
});
