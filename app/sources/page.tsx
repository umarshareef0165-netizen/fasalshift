import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sources & method — FasalShift',
  description:
    'Every dataset FasalShift uses, and the honest method notes behind each number: NASA POWER, GPM IMERG, SMAP, Landsat 8–9, ECOSTRESS, and the labelled Open-Meteo fallback.',
};

interface Source {
  name: string;
  what: string;
  url: string;
  note: string;
  nasa: boolean;
}

const SOURCES: Source[] = [
  {
    name: 'NASA POWER — Daily Point API',
    what: 'Temperature at 2 m (T2M, °C), precipitation corrected (PRECTOTCORR, mm/day), wind speed at 2 m (WS2M, m/s). Community AG (agroclimatology). Source: MERRA-2 / GEOS. Feeds the onset-shift math, the live 14-day panel, GDD and heat days.',
    url: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    note: 'Verified live Nov 12, 2026. Free, no key.',
    nasa: true,
  },
  {
    name: 'NASA POWER — Climatology API',
    what: '25-year monthly climatology (Jan 2001–Dec 2025) for the same parameters. Used as the baseline for “hotter/drier than normal” and for the monsoon water-availability ratio.',
    url: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
    note: 'Verified live Nov 12, 2026. Free, no key.',
    nasa: true,
  },
  {
    name: 'GPM IMERG',
    what: 'Global Precipitation Measurement rainfall (~10 km) — rainfall onset and intensity.',
    url: 'https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGDL.07/',
    note: 'File download needs a free NASA Earthdata account (https://urs.earthdata.nasa.gov). POWER PRECTOTCORR is the coarser fallback and is labelled as such.',
    nasa: true,
  },
  {
    name: 'SMAP L3/L4',
    what: 'Soil Moisture Active Passive — current soil moisture (record starts 2015).',
    url: 'https://nsidc.org/data/smap',
    note: 'File download needs a free NASA Earthdata account. Used for CURRENT conditions only — never for a 20-year trend (record too short).',
    nasa: true,
  },
  {
    name: 'Landsat 8–9 (OLI/TIRS)',
    what: 'Vegetation and land-surface context.',
    url: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=Landsat%208',
    note: 'Collection search verified public, no auth (Nov 12, 2026). File download needs a free Earthdata account. Pre-computed layer only, badged with source and date.',
    nasa: true,
  },
  {
    name: 'ECOSTRESS L2T LSTE',
    what: 'Land surface temperature (70 m) — water and heat stress.',
    url: 'https://cmr.earthdata.nasa.gov/search/granules.json?short_name=ECO_L2T_LSTE',
    note: 'Granule search verified public, no auth — 3 granules over Faisalabad, Oct 2026. File download needs a free Earthdata account. Pre-computed layer only, badged with source and date.',
    nasa: true,
  },
  {
    name: 'Open-Meteo (fallback — NOT NASA)',
    what: 'Forecast and past-days temperature/precipitation, and ERA5-based soil moisture (soil_moisture_0_to_1cm). Used only when a NASA source is unreachable.',
    url: 'https://api.open-meteo.com/v1/forecast',
    note: 'Free, no key. Labelled “Open-Meteo / ERA5 reanalysis” wherever it appears — never presented as NASA data.',
    nasa: false,
  },
];

const METHOD_NOTES: string[] = [
  'POWER daily data lags about 2 days: at verification (Nov 12, 2026) the latest complete day was Nov 9, 2026, and Nov 10–11 returned the fill value -999. The app skips -999 days in every sum, count and average — it never plots or averages them.',
  'Monsoon onset rule (shown in the app): the first day after June 1 whose 3-day PRECTOTCORR total is at least 7.5 mm (2.5 mm/day average).',
  'Shift = median monsoon onset 2023–2025 minus onset 2004. A positive number means the onset is later than in 2004.',
  'Trend test: ordinary least squares over onset years 2004–2025. If p ≥ 0.05 the app says so honestly: “trend not statistically significant”.',
  'GDD uses a wheat base temperature of 5 °C over the rabi season (Oct 15–Apr 15). Heat days count days with daily mean T2M above 32 °C during grain fill (Mar 1–Apr 15). If more than 10% of a season is missing, the app shows “insufficient data” instead of a number.',
  'SMAP is used for CURRENT soil conditions only — its record starts in 2015, so it can never support a 20-year trend claim.',
  'Rotation scores are deterministic, transparent rules (water need, soil effect, heat tolerance, margin) weighted 35% water / 25% soil / 25% heat / 15% margin. Wheat baseline yield 3.12 t/ha comes from the AgriYield Advisor model (backtest MAE 0.090). No yields for cotton, pulses or maize are modelled — margin is a labelled relative rule, not a prediction.',
  'Any pre-computed district value is generated during the sprint from live API calls and cached; it is never fabricated. Pre-computed values are badged with their source and date in the UI.',
  'No pilot users yet. Nothing on this site is farmer-validated.',
];

export default function SourcesPage() {
  return (
    <div>
      <header className="site-header">
        <div className="site-header-inner">
          <h1>
            <span className="brand-gold">FasalShift</span> — Sources &amp; method
          </h1>
          <p className="tagline">
            Every dataset used, cited per NASA Space Apps terms. Values are
            fetched live during the event; this page lists the sources, not
            data.
          </p>
        </div>
      </header>

      <main className="page">
        <section className="section">
          <h2>Datasets</h2>
          <ul className="sources-list">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <h3>
                  {s.name}{' '}
                  {s.nasa ? (
                    <span className="badge">NASA</span>
                  ) : (
                    <span className="badge gold">Non-NASA fallback</span>
                  )}
                </h3>
                <p>{s.what}</p>
                <p>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <code>{s.url}</code>
                  </a>
                </p>
                <p className="muted small">{s.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <h2>Method notes — honest labelling</h2>
          <div className="card">
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {METHOD_NOTES.map((n) => (
                <li key={n.slice(0, 40)} style={{ marginBottom: '0.6rem' }}>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p style={{ marginTop: '1.5rem' }}>
          <Link href="/">← Back to the planner</Link>
        </p>

        <footer className="site-footer">
          Built on NASA open data · No pilot users yet · All numbers live from
          NASA POWER or labelled rules
        </footer>
      </main>
    </div>
  );
}
