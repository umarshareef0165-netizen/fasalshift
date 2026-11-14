import type { RotationScore } from '@/lib/fasalshift-types';
import { fmt1 } from '@/lib/fasalshift-types';

interface RotationCompareProps {
  scores: RotationScore[] | null;
  strings: {
    heading: string;
    recommended: string;
    water: string;
    soil: string;
    heat: string;
    margin: string;
    notComputed: string;
    ofTen: string;
  };
}

const DIMENSIONS = ['water', 'soil', 'heat', 'margin'] as const;
type Dimension = (typeof DIMENSIONS)[number];

export default function RotationCompare({
  scores,
  strings,
}: RotationCompareProps) {
  const dimLabel: Record<Dimension, string> = {
    water: strings.water,
    soil: strings.soil,
    heat: strings.heat,
    margin: strings.margin,
  };

  const winnerId =
    scores && scores.length > 0
      ? scores.reduce((best, s) => (s.total > best.total ? s : best)).id
      : null;

  return (
    <div>
      <h2>{strings.heading}</h2>
      {!scores ? (
        <div className="card">
          <p>{strings.notComputed}</p>
        </div>
      ) : (
        <div className="rotation-grid">
          {scores.map((s) => {
            const isWinner = s.id === winnerId;
            return (
              <article
                key={s.id}
                className={`rotation-card${isWinner ? ' winner' : ''}`}
              >
                {isWinner && (
                  <span className="rec-badge">{strings.recommended}</span>
                )}
                <h3>{s.name}</h3>
                <p className="muted small" lang="ur">
                  {s.nameUrdu}
                </p>
                <p className="total">
                  {fmt1(s.total)}{' '}
                  <span className="of-ten">{strings.ofTen}</span>
                </p>
                {isWinner && (
                  <p className="rec-line">
                    ★ {strings.recommended} — {s.reason}
                  </p>
                )}
                {DIMENSIONS.map((dim) => (
                  <div className="dim-row" key={dim}>
                    <span className="dim-label">{dimLabel[dim]}</span>
                    <span
                      className="bar-track"
                      role="img"
                      aria-label={`${dimLabel[dim]} ${fmt1(s[dim])} / 10`}
                    >
                      <span
                        className="bar-fill"
                        aria-hidden="true"
                        style={{ width: `${Math.max(0, Math.min(10, s[dim])) * 10}%` }}
                      />
                    </span>
                    <span className="dim-value">{fmt1(s[dim])}</span>
                  </div>
                ))}
                <p className="reason">{s.reason}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
