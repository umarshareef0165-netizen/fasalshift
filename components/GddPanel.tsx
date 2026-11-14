import type { DistrictData } from '@/lib/fasalshift-types';
import { fmt1 } from '@/lib/fasalshift-types';

interface GddPanelProps {
  district: DistrictData | null;
  strings: {
    heading: string;
    notComputed: string;
    heatLine: (a: number, b: number) => string;
    heatCapNote: string;
    gddLine: (a: number, b: number) => string;
    insufficient: string;
    season2004: string;
    seasonRecent: string;
    heatDaysLabel: string;
    gddLabel: string;
    missingLabel: string;
  };
}

function seasonBlock(
  label: string,
  gdd: number,
  heatDays: number,
  missingPct: number,
  strings: GddPanelProps['strings'],
) {
  if (missingPct > 10) {
    return (
      <p>
        <strong>{label}:</strong> {strings.insufficient}
      </p>
    );
  }
  return (
    <p>
      <strong>{label}:</strong> {strings.gddLabel} {fmt1(gdd)} ·{' '}
      {strings.heatDaysLabel} {heatDays} · {strings.missingLabel}{' '}
      {fmt1(missingPct)}%
    </p>
  );
}

/**
 * Grain-fill heat / growing-degree-day panel, from the district cache.
 * A season with >10% missing data shows "insufficient data", never a number.
 */
export default function GddPanel({ district, strings }: GddPanelProps) {
  if (!district) {
    return (
      <div className="card">
        <h3>{strings.heading}</h3>
        <p>{strings.notComputed}</p>
      </div>
    );
  }

  const { season2004, seasonRecent } = district.gdd;
  const heatOk = season2004.missingPct <= 10 && seasonRecent.missingPct <= 10;

  return (
    <div className="card">
      <h3>{strings.heading}</h3>
      {heatOk ? (
        <p>
          <strong>
            {strings.heatLine(season2004.heatDays, seasonRecent.heatDays)}
          </strong>
        </p>
      ) : (
        <p>{strings.insufficient}</p>
      )}
      {heatOk && season2004.heatDays === 0 ? (
        <p className="fine-print">{strings.heatCapNote}</p>
      ) : null}
      {seasonBlock(
        strings.season2004,
        season2004.gdd,
        season2004.heatDays,
        season2004.missingPct,
        strings,
      )}
      {seasonBlock(
        strings.seasonRecent,
        seasonRecent.gdd,
        seasonRecent.heatDays,
        seasonRecent.missingPct,
        strings,
      )}
    </div>
  );
}
