import type { DistrictData, RotationScore } from '@/lib/fasalshift-types';
import { fmt1 } from '@/lib/fasalshift-types';

interface ShiftCardProps {
  district: DistrictData | null;
  winner: RotationScore | null;
  strings: {
    heroLabel: string;
    daysUnit: string;
    notComputed: string;
    onsetBaseline: (date: string | null) => string;
    onsetRecent: (date: string | null) => string;
    trendPrefix: string;
    daysPerYear: string;
    yearsWord: string;
    notSignificant: string;
    recommended: string;
  };
}

function fmtP(p: number): string {
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

function fmtSlope(slope: number): string {
  const sign = slope > 0 ? '+' : '';
  return `${sign}${slope.toFixed(1)}`;
}

/**
 * Hero card: the growing-window shift in days, plus the onset trend line.
 * Every number comes from props (the district cache). Nothing is invented:
 * a null shift renders the honest "not yet computed" state.
 */
export default function ShiftCard({ district, winner, strings }: ShiftCardProps) {
  if (!district) {
    return (
      <div className="shift-hero" aria-live="polite">
        <div className="hero-label">{strings.heroLabel}</div>
        <p className="hero-number">—</p>
        <p className="hero-sub">{strings.notComputed}</p>
      </div>
    );
  }

  const { shiftDays, onset2004, onsetRecent, trend } = district;
  const significant = trend.pValue < 0.05;

  return (
    <div>
      <div className="shift-hero" aria-live="polite">
        <div className="hero-label">{strings.heroLabel}</div>
        {shiftDays === null ? (
          <>
            <p className="hero-number">—</p>
            <p className="hero-sub">{strings.notComputed}</p>
          </>
        ) : (
          <>
            <p className="hero-number">
              {shiftDays > 0 ? '+' : ''}
              {shiftDays}{' '}
              <span className="unit">{strings.daysUnit}</span>
            </p>
            <p className="hero-sub">
              {strings.onsetBaseline(onset2004.date)}
              {' · '}
              {strings.onsetRecent(onsetRecent.date)}
            </p>
          </>
        )}
        {winner && (
          <p className="hero-winner">
            {strings.recommended}: {winner.name} — {fmt1(winner.total)}/10
          </p>
        )}
      </div>

      <div className="trend-line" aria-live="polite">
        <strong>
          {strings.trendPrefix} {fmtSlope(trend.slopePerYear)}{' '}
          {strings.daysPerYear} (p = {fmtP(trend.pValue)})
        </strong>{' '}
        <span className="muted">
          · {trend.n} {strings.yearsWord}
        </span>
        {!significant && (
          <span className="sig-warn"> — {strings.notSignificant}</span>
        )}
      </div>
    </div>
  );
}
