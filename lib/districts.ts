export interface District {
  id: string;
  name: string;
  nameUrdu: string;
  lat: number;
  lon: number;
}

export const DISTRICTS: District[] = [
  { id: "faisalabad", name: "Faisalabad", nameUrdu: "فیصل آباد", lat: 31.4504, lon: 73.135 },
  { id: "lahore", name: "Lahore", nameUrdu: "لاہور", lat: 31.5204, lon: 74.3587 },
  { id: "multan", name: "Multan", nameUrdu: "ملتان", lat: 30.1575, lon: 71.5249 },
  { id: "layyah", name: "Layyah", nameUrdu: "لیہ", lat: 30.9693, lon: 70.9407 },
];

export const DISTRICT_BY_ID: Record<string, District> = Object.fromEntries(
  DISTRICTS.map((d) => [d.id, d]),
);
