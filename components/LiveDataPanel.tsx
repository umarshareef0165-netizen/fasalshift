import type { DistrictData } from '@/lib/fasalshift-types';

interface LiveDataPanelProps {
  district: DistrictData | null;
  generatedAt: string | null;
  strings: {
    heading: string;
    notComputed: string;
    dateCol: string;
    tempCol: string;
    rainCol: string;
    windCol: string;
    missing: string;
    sourceBadge: (generatedAt: string) => string;
    lagNote: string;
  };
}

function cell(value: number | null, missingLabel: string): {
  text: string;
  missing: boolean;
} {
  if (value === null || value === -999) {
    return { text: missingLabel, missing: true };
  }
  return { text: String(value), missing: false };
}

/**
 * Last-14-days NASA POWER table, straight from the district cache.
 * -999 fill values render as "— not yet published", never as data.
 */
export default function LiveDataPanel({
  district,
  generatedAt,
  strings,
}: LiveDataPanelProps) {
  if (!district || district.live14.length === 0) {
    return (
      <div className="card">
        <h3>{strings.heading}</h3>
        <p>{strings.notComputed}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{strings.heading}</h3>
      <p>
        {generatedAt ? (
          <span className="badge">{strings.sourceBadge(generatedAt)}</span>
        ) : (
          <span className="badge grey">NASA POWER Daily</span>
        )}
      </p>
      <p className="muted small">{strings.lagNote}</p>
      <div className="table-wrap">
        <table className="live-table">
          <thead>
            <tr>
              <th scope="col">{strings.dateCol}</th>
              <th scope="col">{strings.tempCol}</th>
              <th scope="col">{strings.rainCol}</th>
              <th scope="col">{strings.windCol}</th>
            </tr>
          </thead>
          <tbody>
            {district.live14.map((d) => {
              const t = cell(d.t2m, strings.missing);
              const r = cell(d.rain, strings.missing);
              const w = cell(d.ws2m, strings.missing);
              return (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td className={t.missing ? 'missing' : undefined}>{t.text}</td>
                  <td className={r.missing ? 'missing' : undefined}>{r.text}</td>
                  <td className={w.missing ? 'missing' : undefined}>{w.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
