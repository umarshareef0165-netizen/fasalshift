'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  DistrictData,
  DistrictKey,
  DistrictsCache,
  RotationId,
  RotationScore,
} from '@/lib/fasalshift-types';
import { ROTATION_IDS, fmt1 } from '@/lib/fasalshift-types';
import { scoreRotations, adaptationMargin, heatPressureFromCounts } from '@/lib/rotation';
import DistrictPicker from '@/components/DistrictPicker';
import ShiftCard from '@/components/ShiftCard';
import RotationCompare from '@/components/RotationCompare';
import SoilCard from '@/components/SoilCard';
import LiveDataPanel from '@/components/LiveDataPanel';
import GddPanel from '@/components/GddPanel';

type Lang = 'en' | 'ur';

const FALLBACK_NAMES: Record<DistrictKey, { name: string; nameUrdu: string }> = {
  faisalabad: { name: 'Faisalabad', nameUrdu: 'فیصل آباد' },
  lahore: { name: 'Lahore', nameUrdu: 'لاہور' },
  multan: { name: 'Multan', nameUrdu: 'ملتان' },
  layyah: { name: 'Layyah', nameUrdu: 'لیہ' },
};

const WINNER_CROP_URDU: Record<RotationId, string> = {
  'wheat-cotton': 'کپاس',
  'wheat-pulses': 'دالیں',
  'wheat-maize': 'مکئی',
};

interface Strings {
  title: string;
  tagline: string;
  pickerLabel: string;
  shiftLabel: string;
  daysUnit: string;
  notComputed: string;
  onsetBaseline: (date: string | null) => string;
  onsetRecent: (date: string | null) => string;
  trendPrefix: string;
  daysPerYear: string;
  yearsWord: string;
  notSignificant: string;
  rotationHeading: string;
  recommended: string;
  water: string;
  soil: string;
  heat: string;
  margin: string;
  ofTen: string;
  marginHeading: string;
  marginLine: (name: string, days: number) => string;
  marginNotComputed: string;
  liveHeading: string;
  dateCol: string;
  tempCol: string;
  rainCol: string;
  windCol: string;
  missing: string;
  sourceBadge: (generatedAt: string) => string;
  lagNote: string;
  gddHeading: string;
  heatLine: (a: number, b: number) => string;
  heatCapNote: string;
  gddLine: (a: number, b: number) => string;
  season2004: string;
  seasonRecent: string;
  heatDaysLabel: string;
  gddLabel: string;
  missingLabel: string;
  insufficient: string;
  soilHeading: string;
  soilValueLabel: string;
  soilUnit: string;
  dateLabel: string;
  sourceLabel: string;
  notSmapNote: string;
  waterFallback: string;
  waterLive: (v: number) => string;
  waterLoading: string;
  voiceButton: string;
  voiceUnavailable: string;
  voiceSpeaking: string;
  sourcesLink: string;
  footer: string;
  weightsNote: string;
  cacheMissing: string;
  answerShift: (name: string, shift: string) => string;
  answerPlant: (name: string, total: string) => string;
  answerLive: string;
  limitsLabel: string;
  honestLimits: (p: number | null) => string;
  selectedLabel: string;
}

const STRINGS: Record<Lang, Strings> = {
  en: {
    title: 'FasalShift',
    tagline:
      'Which rotation should a Punjab farmer plant next — from live NASA data.',
    pickerLabel: 'Choose your district',
    shiftLabel: 'Growing window shifted',
    daysUnit: 'days',
    notComputed: 'not yet computed',
    onsetBaseline: (d) => `Monsoon onset 2004: ${d ?? '—'}`,
    onsetRecent: (d) => `Recent onset (2023–2025 median): ${d ?? '—'}`,
    trendPrefix: 'Onset is shifting',
    daysPerYear: 'days/year',
    yearsWord: 'years in trend',
    notSignificant: 'trend not statistically significant',
    rotationHeading: 'Which rotation should you plant next?',
    recommended: 'Recommended',
    water: 'Water',
    soil: 'Soil',
    heat: 'Heat',
    margin: 'Margin',
    ofTen: '/ 10',
    marginHeading: 'Adaptation Margin — how late can planting slip?',
    marginLine: (name, days) =>
      `${name} still works if planting slips ${days} days`,
    marginNotComputed:
      'Adaptation margin not yet computed — rabi daily data is missing.',
    liveHeading: 'Live NASA data — last 14 days',
    dateCol: 'Date',
    tempCol: 'Temp (°C)',
    rainCol: 'Rain (mm/day)',
    windCol: 'Wind (m/s)',
    missing: '— not yet published',
    sourceBadge: (g) => `NASA POWER Daily, fetched ${g}`,
    lagNote:
      'NASA POWER daily data lags about 2 days. Missing days are shown, never plotted or averaged.',
    gddHeading: 'Grain-fill heat',
    heatLine: (a, b) => `Grain-fill heat days: 2004 = ${a}, recent = ${b}`,
    heatCapNote:
      '2004 baseline had 0 heat days, so heat pressure is capped at 2.0× (labelled rule).',
    gddLine: (a, b) => `Growing degree days: 2004 = ${a}, recent = ${b}`,
    season2004: '2004 season',
    seasonRecent: 'Recent season (2023–2025)',
    heatDaysLabel: 'heat days',
    gddLabel: 'GDD',
    missingLabel: 'missing',
    insufficient: 'insufficient data',
    soilHeading: 'Soil moisture now',
    soilValueLabel: 'Soil moisture',
    soilUnit: 'm³/m³',
    dateLabel: 'Date',
    sourceLabel: 'Source',
    notSmapNote: 'Open-Meteo archive (ERA5 reanalysis) — NOT SMAP',
    waterFallback:
      'Live monsoon data unavailable — using climatology baseline',
    waterLive: (v) =>
      `Monsoon water availability: ${v.toFixed(2)}× climatology (live, Jun–Sep 2025)`,
    waterLoading: 'Checking live monsoon data…',
    voiceButton: '🔊 Listen in Urdu',
    voiceUnavailable: 'Voice summary is not available in this browser.',
    voiceSpeaking: 'Speaking…',
    sourcesLink: 'Data sources & method →',
    footer:
      'Built on NASA open data · No pilot users yet · All numbers live from NASA POWER or labelled rules',
    weightsNote:
      'Scores 0–10. Weights: water 35%, soil 25%, heat 25%, margin 15%. Water, soil and heat rules are labelled agronomic rules — see Sources.',
    cacheMissing:
      'District data has not been computed yet. The numbers below will appear once the live NASA pipeline finishes — nothing here is estimated.',
    answerShift: (name, shift) => `${name}: monsoon ${shift} days`,
    answerPlant: (name, total) => `Plant ${name} (${total}/10)`,
    answerLive: 'Live NASA POWER',
    limitsLabel: 'Honest limits',
    honestLimits: (p) =>
      p === null
        ? 'Soil is ERA5, not SMAP · No pilot users yet · POWER lags ~2 days'
        : `Trend p ${p < 0.01 ? '< 0.01' : `= ${p.toFixed(2)}`} (${p < 0.05 ? 'statistically significant' : 'not significant'}) · Soil is ERA5, not SMAP · No pilot users yet · POWER lags ~2 days`,
    selectedLabel: 'Selected',
  },
  ur: {
    title: 'فصل شفٹ',
    tagline:
      'پنجاب کے کسان کو اگلی فصل کون سی لگانی چاہیے — ناسا کے براہ راست ڈیٹا سے۔',
    pickerLabel: 'اپنا ضلع منتخب کریں',
    shiftLabel: 'کاشت کا موسم بدل گیا',
    daysUnit: 'دن',
    notComputed: 'ابھی حساب نہیں ہوا',
    onsetBaseline: (d) => `مون سون کی آمد 2004: ${d ?? '—'}`,
    onsetRecent: (d) => `حالیہ آمد (2023–2025 اوسط): ${d ?? '—'}`,
    trendPrefix: 'آمد ہر سال بدل رہی ہے',
    daysPerYear: 'دن/سال',
    yearsWord: 'سال کا رجحان',
    notSignificant: 'رجحان شماریاتی طور پر اہم نہیں',
    rotationHeading: 'اگلی فصل کون سی لگائیں؟',
    recommended: 'تجویز کردہ',
    water: 'پانی',
    soil: 'مٹی',
    heat: 'گرمی',
    margin: 'گنجائش',
    ofTen: '/ 10',
    marginHeading: 'موافقت کی گنجائش — کاشت کتنی دیر سے ہو سکتی ہے؟',
    marginLine: (name, days) =>
      `${name} تب بھی کام کرے گی اگر کاشت ${days} دن دیر سے ہو`,
    marginNotComputed:
      'موافقت کی گنجائش ابھی حساب نہیں ہوئی — ربیع کے روزانہ ڈیٹا موجود نہیں۔',
    liveHeading: 'ناسا کا براہ راست ڈیٹا — پچھلے 14 دن',
    dateCol: 'تاریخ',
    tempCol: 'درجہ حرارت (°C)',
    rainCol: 'بارش (ملی میٹر/دن)',
    windCol: 'ہوا (میٹر/سیکنڈ)',
    missing: '— ابھی شائع نہیں ہوا',
    sourceBadge: (g) => `ناسا پاور روزانہ، حاصل کردہ ${g}`,
    lagNote:
      'ناسا پاور کا روزانہ ڈیٹا تقریباً 2 دن پیچھے ہوتا ہے۔ غائب دن دکھائے جاتے ہیں، کبھی گنے نہیں جاتے۔',
    gddHeading: 'دانے بھرنے کے دوران گرمی',
    heatLine: (a, b) => `دانے بھرنے کے گرم دن: 2004 = ${a}، حالیہ = ${b}`,
    heatCapNote:
      '2004 میں کوئی گرم دن نہیں تھا، اس لیے حرارتی دباؤ 2.0 گنا تک محدود ہے (واضح قاعدہ)۔',
    gddLine: (a, b) => `بڑھوتری کے درجے: 2004 = ${a}، حالیہ = ${b}`,
    season2004: '2004 کا موسم',
    seasonRecent: 'حالیہ موسم (2023–2025)',
    heatDaysLabel: 'گرم دن',
    gddLabel: 'جی ڈی ڈی',
    missingLabel: 'غائب',
    insufficient: 'ناکافی ڈیٹا',
    soilHeading: 'مٹی کی نمی ابھی',
    soilValueLabel: 'مٹی کی نمی',
    soilUnit: 'm³/m³',
    dateLabel: 'تاریخ',
    sourceLabel: 'ماخذ',
    notSmapNote: 'اوپن میٹیو آرکائیو (ERA5) — SMAP نہیں',
    waterFallback:
      'براہ راست مون سون ڈیٹا دستیاب نہیں — موسمیاتی اوسط استعمال ہو رہی ہے',
    waterLive: (v) =>
      `مون سون میں پانی کی دستیابی: موسمیاتی اوسط کا ${v.toFixed(2)} گنا (براہ راست، جون تا ستمبر 2025)`,
    waterLoading: 'براہ راست مون سون ڈیٹا چیک ہو رہا ہے…',
    voiceButton: '🔊 اردو میں سنیں',
    voiceUnavailable: 'اس براؤزر میں صوتی خلاصہ دستیاب نہیں۔',
    voiceSpeaking: 'بولا جا رہا ہے…',
    sourcesLink: 'ڈیٹا کے ذرائع اور طریقہ کار →',
    footer:
      'ناسا کے کھلے ڈیٹا پر مبنی · ابھی کوئی آزمائشی کسان نہیں · تمام اعداد ناسا پاور سے براہ راست یا واضح اصولوں سے',
    weightsNote:
      'اسکور 0–10۔ وزن: پانی 35٪، مٹی 25٪، گرمی 25٪، گنجائش 15٪۔ پانی، مٹی اور گرمی کے اصول واضح زرعی اصول ہیں — ذرائع دیکھیں۔',
    cacheMissing:
      'ضلعی ڈیٹا کا حساب ابھی نہیں ہوا۔ ناسا کی براہ راست پائپ لائن مکمل ہوتے ہی نیچے اعداد آ جائیں گے — یہاں کچھ بھی اندازے سے نہیں لکھا گیا۔',
    answerShift: (name, shift) => `${name}: مون سون ${shift} دن`,
    answerPlant: (name, total) => `${name} لگائیں (${total}/10)`,
    answerLive: 'Live NASA POWER',
    limitsLabel: 'ایماندارانہ حدود',
    honestLimits: (p) =>
      p === null
        ? 'مٹی ERA5 ہے، SMAP نہیں · ابھی کوئی آزمائشی کسان نہیں · POWER تقریباً 2 دن پیچھے'
        : `رجحان p ${p < 0.01 ? '< 0.01' : `= ${p.toFixed(2)}`} (${p < 0.05 ? 'شماریاتی طور پر اہم' : 'اہم نہیں'}) · مٹی ERA5 ہے، SMAP نہیں · ابھی کوئی آزمائشی کسان نہیں · POWER تقریباً 2 دن پیچھے`,
    selectedLabel: 'منتخب',
  },
};

/** Mean Jun–Sep climatology rain (mm/day) from the cache, or null. */
function climatologyJunSepMean(d: DistrictData): number | null {
  const months = ['JUN', 'JUL', 'AUG', 'SEP'];
  const vals: number[] = [];
  for (const m of months) {
    const rain = d.climatology[m]?.rain;
    if (typeof rain !== 'number' || Number.isNaN(rain)) return null;
    vals.push(rain);
  }
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Extract a daily PRECTOTCORR series from whatever shape the
 * /api/nasa/power route returns: raw POWER passthrough
 * (properties.parameter.PRECTOTCORR keyed by YYYYMMDD) or a normalised
 * { data | daily: [{ date, rain }] } array.
 */
function extractDailyRain(json: unknown): number[] {
  if (!json || typeof json !== 'object') return [];
  const obj = json as Record<string, unknown>;

  const param = (
    obj.properties as Record<string, unknown> | undefined
  )?.parameter as Record<string, unknown> | undefined;
  const series = param?.PRECTOTCORR as
    | Record<string, unknown>
    | undefined;
  if (series && typeof series === 'object') {
    return Object.values(series).filter(
      (v): v is number => typeof v === 'number' && v !== -999,
    );
  }

  const arr = (obj.days ?? obj.data ?? obj.daily) as unknown;
  if (Array.isArray(arr)) {
    const out: number[] = [];
    for (const row of arr) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const v = r.rain ?? r.PRECTOTCORR ?? r.prectotcorr;
      if (typeof v === 'number' && v !== -999) out.push(v);
    }
    return out;
  }
  return [];
}

export default function Planner({ cache }: { cache: DistrictsCache | null }) {
  const [districtKey, setDistrictKey] = useState<DistrictKey>('faisalabad');
  const [lang, setLang] = useState<Lang>('en');
  const [waterAvailable, setWaterAvailable] = useState<number | null>(null);
  // Raw monsoon ratio for display; waterAvailable (scoring input) is clamped
  // to [0, 2] so a very wet monsoon cannot inflate scores beyond the scale.
  // The engine (lib/rotation.ts) caps the SCORING input further at 1.0
  // (WATER_AVAILABLE_CAP, labelled rule); the displayed ratio stays true.
  const [waterRatio, setWaterRatio] = useState<number | null>(null);
  const [waterLive, setWaterLive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const t = STRINGS[lang];
  const district: DistrictData | null =
    cache?.districts[districtKey] ?? null;
  const districtsMap: Partial<Record<DistrictKey, DistrictData>> =
    cache?.districts ?? {};

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' && 'speechSynthesis' in window,
    );
  }, []);

  // Live monsoon water availability: Jun 1 – Sep 30 2025 daily rain from the
  // POWER proxy vs the Jun–Sep climatology mean from the cache.
  // November rain would be meaningless (dry season), so we never use live14.
  useEffect(() => {
    if (!district) {
      setWaterAvailable(null);
      setWaterRatio(null);
      setWaterLive(false);
      return;
    }
    const climMean = climatologyJunSepMean(district);
    if (climMean === null || climMean <= 0) {
      setWaterAvailable(1.0);
      setWaterRatio(null);
      setWaterLive(false);
      return;
    }
    let cancelled = false;
    const url =
      `/api/nasa/power?lat=${district.lat}&lon=${district.lon}` +
      `&start=20250601&end=20250930`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`POWER proxy HTTP ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled) return;
        const daily = extractDailyRain(json);
        if (daily.length < 30) throw new Error('too few monsoon days');
        const recentMean =
          daily.reduce((a, b) => a + b, 0) / daily.length;
        const ratio = recentMean / climMean;
        setWaterRatio(ratio);
        setWaterAvailable(Math.max(0, Math.min(2, ratio)));
        setWaterLive(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Honest fallback: climatology baseline, badged as such.
        setWaterAvailable(1.0);
        setWaterRatio(null);
        setWaterLive(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the district changes (lat/lon + climatology change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtKey, cache]);

  const heatPressure = useMemo(() => {
    if (!district) return null;
    return heatPressureFromCounts(
      district.gdd.seasonRecent.heatDays,
      district.gdd.season2004.heatDays,
    );
  }, [district]);

  const scores: RotationScore[] | null = useMemo(() => {
    if (!district || waterAvailable === null || heatPressure === null) {
      return null;
    }
    try {
      return scoreRotations({ waterAvailable, heatPressure });
    } catch {
      return null;
    }
  }, [district, waterAvailable, heatPressure]);

  const margins: Partial<Record<RotationId, number>> = useMemo(() => {
    if (!district || waterAvailable === null || district.rabiDaily.length === 0) {
      return {};
    }
    const out: Partial<Record<RotationId, number>> = {};
    for (const id of ROTATION_IDS) {
      try {
        out[id] = adaptationMargin(id, {
          rabiDaily: district.rabiDaily,
          waterAvailable,
        });
      } catch {
        // Leave this rotation without a margin — rendered as not computed.
      }
    }
    return out;
  }, [district, waterAvailable]);

  const winner: RotationScore | null =
    scores && scores.length > 0
      ? scores.reduce((best, s) => (s.total > best.total ? s : best))
      : null;

  const speakSummary = () => {
    if (!('speechSynthesis' in window)) return;
    const d = district;
    const nameUrdu = d?.nameUrdu ?? FALLBACK_NAMES[districtKey].nameUrdu;
    const s1 =
      d && d.shiftDays !== null
        ? `${nameUrdu} میں مون سون کی آمد ${d.shiftDays} دن پیچھے ہو گئی ہے۔`
        : `${nameUrdu} میں مون سون کی آمد کا حساب ابھی نہیں ہوا۔`;
    const s2 = winner
      ? `گندم کے بعد ${WINNER_CROP_URDU[winner.id]} بہترین انتخاب ہے۔`
      : 'فصل کا انتخاب ابھی حساب نہیں ہوا۔';
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`${s1} ${s2}`);
    utter.lang = 'ur-PK';
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const dir = lang === 'ur' ? 'rtl' : 'ltr';

  // One-line answer strip, built only from live values already in this
  // component. Degrades gracefully: a missing value is simply left out,
  // never invented.
  const answerParts: string[] = [];
  if (district && district.shiftDays !== null) {
    const sign = district.shiftDays > 0 ? '+' : '';
    const name = lang === 'ur' ? district.nameUrdu : district.name;
    answerParts.push(t.answerShift(name, `${sign}${district.shiftDays}`));
  }
  if (winner) {
    const name = lang === 'ur' ? winner.nameUrdu : winner.name;
    answerParts.push(t.answerPlant(name, fmt1(winner.total)));
  }
  answerParts.push(t.answerLive);

  return (
    <div dir={dir} lang={lang === 'ur' ? 'ur' : 'en'}>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="header-row">
            <h1>
              <span className="brand-gold">FasalShift</span>{' '}
              {lang === 'ur' ? '— فصل شفٹ' : ''}
            </h1>
            <div className="header-actions">
              <span className="badge badge-live">● Live NASA POWER</span>
              <a href="#voice-summary" className="header-listen">
                🔊 Listen
              </a>
              <button
                type="button"
                className="lang-toggle"
                onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
                aria-label={
                  lang === 'en' ? 'Switch to Urdu' : 'انگریزی میں بدلیں'
                }
              >
                {lang === 'en' ? 'اردو' : 'English'}
              </button>
            </div>
          </div>
          <p className="tagline">{t.tagline}</p>
        </div>
      </header>

      <main className="page">
        <p className="answer-strip" role="status">
          {answerParts.join(' · ')}
        </p>

        {!cache && (
          <div className="notice" role="status">
            {t.cacheMissing}
          </div>
        )}

        <section className="section" aria-label={t.pickerLabel}>
          <DistrictPicker
            districts={districtsMap}
            selected={districtKey}
            onSelect={setDistrictKey}
            label={t.pickerLabel}
            fallbackNames={FALLBACK_NAMES}
            selectedLabel={t.selectedLabel}
          />
        </section>

        <section className="section">
          <ShiftCard
            district={district}
            winner={winner}
            strings={{
              heroLabel: district
                ? `${t.shiftLabel} — ${lang === 'ur' ? district.nameUrdu : district.name}`
                : t.shiftLabel,
              daysUnit: t.daysUnit,
              notComputed: t.notComputed,
              onsetBaseline: t.onsetBaseline,
              onsetRecent: t.onsetRecent,
              trendPrefix: t.trendPrefix,
              daysPerYear: t.daysPerYear,
              yearsWord: t.yearsWord,
              notSignificant: t.notSignificant,
              recommended: t.recommended,
            }}
          />
        </section>

        <section className="section">
          <RotationCompare
            scores={scores}
            strings={{
              heading: t.rotationHeading,
              recommended: t.recommended,
              water: t.water,
              soil: t.soil,
              heat: t.heat,
              margin: t.margin,
              notComputed: t.notComputed,
              ofTen: t.ofTen,
            }}
          />
          <p className="muted small">{t.weightsNote}</p>
          <p className="muted small">
            <strong>{t.limitsLabel}:</strong>{' '}
            {t.honestLimits(
              district ? district.trend.pValue : null,
            )}
          </p>
          <p className="small">
            {waterAvailable === null ? (
              <span className="badge grey">{t.waterLoading}</span>
            ) : waterLive ? (
              <span className="badge">{t.waterLive(waterRatio ?? waterAvailable)}</span>
            ) : (
              <span className="badge grey">{t.waterFallback}</span>
            )}
          </p>
        </section>

        <section className="section">
          <div className="card">
            <h3>{t.marginHeading}</h3>
            {district && Object.keys(margins).length > 0 ? (
              <ul className="margin-list">
                {ROTATION_IDS.map((id) => {
                  const s = scores?.find((x) => x.id === id);
                  const days = margins[id];
                  return (
                    <li key={id}>
                      <span>
                        {s ? s.name : FALLBACK_NAMES[districtKey].name}
                        {lang === 'ur' && s ? (
                          <>
                            {' '}
                            <span lang="ur">({s.nameUrdu})</span>
                          </>
                        ) : null}
                      </span>
                      <span className="margin-days">
                        {typeof days === 'number'
                          ? t.marginLine(s?.name ?? id, days)
                          : t.marginNotComputed}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>{t.marginNotComputed}</p>
            )}
          </div>
        </section>

        <section className="section two-col">
          <GddPanel
            district={district}
            strings={{
              heading: t.gddHeading,
              notComputed: t.notComputed,
              heatLine: t.heatLine,
              heatCapNote: t.heatCapNote,
              gddLine: t.gddLine,
              insufficient: t.insufficient,
              season2004: t.season2004,
              seasonRecent: t.seasonRecent,
              heatDaysLabel: t.heatDaysLabel,
              gddLabel: t.gddLabel,
              missingLabel: t.missingLabel,
            }}
          />
          <SoilCard
            district={district}
            strings={{
              heading: t.soilHeading,
              notComputed: t.notComputed,
              valueLabel: t.soilValueLabel,
              dateLabel: t.dateLabel,
              sourceLabel: t.sourceLabel,
              notSmapNote: t.notSmapNote,
              unit: t.soilUnit,
            }}
          />
        </section>

        <section className="section">
          <LiveDataPanel
            district={district}
            generatedAt={cache?.generatedAt ?? null}
            strings={{
              heading: t.liveHeading,
              notComputed: t.notComputed,
              dateCol: t.dateCol,
              tempCol: t.tempCol,
              rainCol: t.rainCol,
              windCol: t.windCol,
              missing: t.missing,
              sourceBadge: t.sourceBadge,
              lagNote: t.lagNote,
            }}
          />
        </section>

        <section className="section" id="voice-summary">
          <div className="card">
            <h3>{lang === 'ur' ? 'آواز میں خلاصہ' : 'Voice summary'}</h3>
            <p className="muted">
              {lang === 'ur'
                ? 'اردو میں دو جملوں کا خلاصہ سنیں — موسم کی تبدیلی اور تجویز کردہ فصل۔'
                : 'Hear a two-sentence Urdu summary — the shift and the recommended rotation.'}
            </p>
            <button
              type="button"
              className="voice-btn"
              onClick={speakSummary}
              disabled={!speechSupported || speaking}
            >
              {speaking ? t.voiceSpeaking : t.voiceButton}
            </button>
            {!speechSupported && (
              <p className="muted small">{t.voiceUnavailable}</p>
            )}
            <p style={{ marginTop: '1rem' }}>
              <Link href="/sources">{t.sourcesLink}</Link>
            </p>
          </div>
        </section>

        <footer className="site-footer">{t.footer}</footer>
      </main>
    </div>
  );
}
