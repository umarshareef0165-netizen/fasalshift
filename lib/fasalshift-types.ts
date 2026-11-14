// Shared types for the FasalShift UI.
// The district-cache shape mirrors the data-layer contract exactly
// (see task spec). Rotation types mirror the rotation-engine contract:
// RotationId / RotationScore as specified for lib/rotation.ts.
export type DistrictKey = 'faisalabad' | 'lahore' | 'multan' | 'layyah';

export interface OnsetInfo {
  date: string | null;
  dayOfYear: number | null;
}

export interface OnsetRecent extends OnsetInfo {
  years: number[];
}

export interface TrendInfo {
  slopePerYear: number;
  pValue: number;
  n: number;
}

export interface OnsetYear {
  year: number;
  date: string | null;
  dayOfYear: number | null;
}

export interface GddSeason {
  gdd: number;
  heatDays: number;
  missingPct: number;
}

export interface ClimatologyMonth {
  t2m: number;
  rain: number;
}

export type Climatology = Record<string, ClimatologyMonth>;

export interface LiveDay {
  date: string;
  t2m: number | null;
  rain: number | null;
  ws2m: number | null;
}

export interface SoilInfo {
  value: number | null;
  date: string | null;
  source: string;
}

export interface RabiDay {
  date: string;
  t2m: number | null;
  rain: number | null;
}

export interface DistrictData {
  name: string;
  nameUrdu: string;
  lat: number;
  lon: number;
  onset2004: OnsetInfo;
  onsetRecent: OnsetRecent;
  shiftDays: number | null;
  trend: TrendInfo;
  onsets: OnsetYear[];
  gdd: {
    season2004: GddSeason;
    seasonRecent: GddSeason;
  };
  climatology: Climatology;
  live14: LiveDay[];
  soil: SoilInfo;
  rabiDaily: RabiDay[];
}

export interface DistrictsCache {
  generatedAt: string;
  source: string;
  districts: Record<DistrictKey, DistrictData>;
}

export type RotationId = 'wheat-cotton' | 'wheat-pulses' | 'wheat-maize';

export interface RotationScore {
  id: RotationId;
  name: string;
  nameUrdu: string;
  water: number;
  soil: number;
  heat: number;
  margin: number;
  total: number;
  reason: string;
}

export const DISTRICT_KEYS: DistrictKey[] = [
  'faisalabad',
  'lahore',
  'multan',
  'layyah',
];

export const ROTATION_IDS: RotationId[] = [
  'wheat-cotton',
  'wheat-pulses',
  'wheat-maize',
];

export const ROTATION_META: Record<
  RotationId,
  { name: string; nameUrdu: string }
> = {
  'wheat-cotton': { name: 'Wheat → Cotton', nameUrdu: 'گندم کے بعد کپاس' },
  'wheat-pulses': { name: 'Wheat → Pulses', nameUrdu: 'گندم کے بعد دالیں' },
  'wheat-maize': { name: 'Wheat → Maize', nameUrdu: 'گندم کے بعد مکئی' },
};

/** Format a number to 1 decimal place. */
export function fmt1(n: number): string {
  return n.toFixed(1);
}

/** Format a date string (YYYY-MM-DD) for display; falls back to the raw value. */
export function fmtDate(date: string | null): string {
  if (!date) return '—';
  return date;
}
