'use client';

import { useEffect, useState } from 'react';

/** One collection's live CMR result, as returned by /api/nasa/cmr. */
interface CmrCollection {
  shortName: string;
  displayName: string;
  available: boolean;
  latestGranuleDate: string | null;
  latestGranuleId: string | null;
}

interface CmrResponse {
  available?: boolean;
  label?: string;
  collections?: CmrCollection[];
}

/** "2026-10-29" -> "Oct 29, 2026" (UTC, so the date never shifts by timezone). */
function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Satellite context — one live line from NASA CMR (metadata only).
 * Degrades to a labelled "unavailable" state when CMR is unreachable;
 * never shows a fake date.
 */
export default function SatelliteContext() {
  const [data, setData] = useState<CmrResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/nasa/cmr')
      .then((res) => {
        if (!res.ok) throw new Error(`CMR proxy HTTP ${res.status}`);
        return res.json() as Promise<CmrResponse>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <h3>Satellite context — live from NASA CMR</h3>
      {data === null && !failed && (
        <p className="muted">Checking NASA CMR…</p>
      )}
      {failed && (
        <p className="muted">
          Satellite context unavailable (NASA CMR unreachable) — metadata
          only, no processing pipeline.
        </p>
      )}
      {data !== null && (
        <ul className="margin-list">
          {(data.collections ?? []).map((c) => (
            <li key={c.shortName}>
              <span>{c.displayName}</span>
              <span>
                {c.available && c.latestGranuleDate
                  ? `Latest granule over Faisalabad: ${fmtDate(c.latestGranuleDate)}`
                  : 'Unavailable'}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        Metadata only, no processing pipeline. File downloads need a free
        NASA Earthdata account — not wired.
      </p>
    </div>
  );
}
