// Live data clients: NASA POWER (daily + climatology) and Open-Meteo archive
// (soil moisture, ERA5 reanalysis — NOT SMAP).
//
// NASA POWER fill value -999 means "missing" (data lags ~2 days). It is NEVER
// averaged or plotted: every -999 becomes `null` here, at the boundary.

export interface DailyPoint {
  /** YYYY-MM-DD */
  date: string;
  /** Mean 2 m air temperature (°C), null where POWER returned -999. */
  t2m: number | null;
  /** Precipitation, bias-corrected (mm/day), null where POWER returned -999. */
  rain: number | null;
  /** Mean 2 m wind speed (m/s), null where POWER returned -999. */
  ws2m: number | null;
}

const POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point";
const CLIM_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

/** NASA POWER fill value for missing data. */
export const POWER_FILL_VALUE = -999;

export const SOIL_SOURCE = "Open-Meteo archive (ERA5 reanalysis) — NOT SMAP";

function toNull(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value === POWER_FILL_VALUE) return null;
  return value;
}

/** "20240601" -> "2024-06-01". */
function yyyymmddToIso(key: string): string {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

interface PowerParameterBlock {
  [param: string]: Record<string, number>;
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${label} request failed: HTTP ${res.status}`);
  }
  return (await res.json()) as unknown;
}

function powerParameters(payload: unknown, label: string): PowerParameterBlock {
  const params = (payload as { properties?: { parameter?: PowerParameterBlock } })
    ?.properties?.parameter;
  if (!params || typeof params !== "object") {
    throw new Error(`${label}: unexpected response shape (no properties.parameter)`);
  }
  return params;
}

/**
 * NASA POWER daily point data for a date range (inclusive, YYYYMMDD).
 * -999 fill values become `null`. Never throws for missing days — they come
 * back as nulls. Throws only on transport / upstream HTTP errors.
 */
export async function fetchPowerDaily(
  lat: number,
  lon: number,
  startYYYYMMDD: string,
  endYYYYMMDD: string,
): Promise<DailyPoint[]> {
  const url =
    `${POWER_BASE}?parameters=T2M,PRECTOTCORR,WS2M&community=AG` +
    `&longitude=${lon}&latitude=${lat}` +
    `&start=${startYYYYMMDD}&end=${endYYYYMMDD}&format=JSON`;
  const params = powerParameters(await fetchJson(url, "NASA POWER daily"), "NASA POWER daily");

  const t2m = params["T2M"] ?? {};
  const rain = params["PRECTOTCORR"] ?? {};
  const ws2m = params["WS2M"] ?? {};
  const keys = Object.keys(t2m).sort();
  return keys.map((key) => ({
    date: yyyymmddToIso(key),
    t2m: toNull(t2m[key]),
    rain: toNull(rain[key]),
    ws2m: toNull(ws2m[key]),
  }));
}

export interface ClimatologyMonth {
  /** 25-yr monthly mean 2 m temperature (°C). */
  t2m: number;
  /** 25-yr monthly mean precipitation (mm/day). */
  rain: number;
}

const CLIM_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
  "ANN",
] as const;

/**
 * NASA POWER 25-year climatology baseline (monthly means), keyed JAN..DEC,ANN.
 */
export async function fetchClimatology(
  lat: number,
  lon: number,
): Promise<Record<string, ClimatologyMonth>> {
  const url =
    `${CLIM_BASE}?parameters=T2M,PRECTOTCORR&community=AG` +
    `&longitude=${lon}&latitude=${lat}&format=JSON`;
  const params = powerParameters(
    await fetchJson(url, "NASA POWER climatology"),
    "NASA POWER climatology",
  );
  const t2m = params["T2M"] ?? {};
  const rain = params["PRECTOTCORR"] ?? {};

  const out: Record<string, ClimatologyMonth> = {};
  for (const month of CLIM_MONTHS) {
    const t = toNull(t2m[month]);
    const r = toNull(rain[month]);
    if (t === null || r === null) {
      throw new Error(`NASA POWER climatology: missing ${month} value`);
    }
    out[month] = { t2m: t, rain: r };
  }
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Latest soil moisture (0–1 cm, m³/m³) from the Open-Meteo archive
 * (ERA5 reanalysis — NOT SMAP). Takes the latest non-null hourly value in
 * the last 3 days. Returns nulls (not an error) when the archive has no
 * usable value in that window.
 */
export async function fetchSoilMoisture(
  lat: number,
  lon: number,
): Promise<{ value: number | null; date: string | null; source: string }> {
  const end = new Date();
  const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
  const url =
    `${OPEN_METEO_ARCHIVE}?latitude=${lat}&longitude=${lon}` +
    `&start_date=${isoDate(start)}&end_date=${isoDate(end)}` +
    `&hourly=soil_moisture_0_to_1cm&timezone=Asia%2FKarachi`;
  const payload = (await fetchJson(url, "Open-Meteo archive")) as {
    hourly?: { time?: string[]; soil_moisture_0_to_1cm?: (number | null)[] };
  };
  const times = payload?.hourly?.time ?? [];
  const values = payload?.hourly?.soil_moisture_0_to_1cm ?? [];

  for (let i = times.length - 1; i >= 0; i--) {
    const v = values[i];
    if (typeof v === "number" && !Number.isNaN(v)) {
      return { value: v, date: times[i].slice(0, 10), source: SOIL_SOURCE };
    }
  }
  return { value: null, date: null, source: SOIL_SOURCE };
}
