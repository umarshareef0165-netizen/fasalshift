import type { DistrictData } from '@/lib/fasalshift-types';

interface SoilCardProps {
  district: DistrictData | null;
  strings: {
    heading: string;
    notComputed: string;
    valueLabel: string;
    dateLabel: string;
    sourceLabel: string;
    notSmapNote: string;
    unit: string;
  };
}

/**
 * Soil moisture card. The value comes from the district cache only.
 * The source is labelled honestly: SMAP is current-only; the Open-Meteo
 * ERA5 fallback is NOT SMAP and is labelled as such.
 */
export default function SoilCard({ district, strings }: SoilCardProps) {
  if (!district || district.soil.value === null) {
    return (
      <div className="card">
        <h3>{strings.heading}</h3>
        <p>{strings.notComputed}</p>
        <p className="muted small">{strings.notSmapNote}</p>
      </div>
    );
  }

  const { value, date, source } = district.soil;
  const isOpenMeteo = /open-?meteo|era5/i.test(source);

  return (
    <div className="card">
      <h3>{strings.heading}</h3>
      <p className="big-value">
        {value.toFixed(3)}{' '}
        <span className="small muted">{strings.unit}</span>
      </p>
      <dl className="kv">
        <dt>{strings.dateLabel}</dt>
        <dd>{date ?? '—'}</dd>
        <dt>{strings.sourceLabel}</dt>
        <dd>{source}</dd>
      </dl>
      {isOpenMeteo && <p className="muted small">{strings.notSmapNote}</p>}
    </div>
  );
}
