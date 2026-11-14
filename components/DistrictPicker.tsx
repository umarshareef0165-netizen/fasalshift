import type { DistrictData, DistrictKey } from '@/lib/fasalshift-types';
import { DISTRICT_KEYS } from '@/lib/fasalshift-types';

interface DistrictPickerProps {
  districts: Partial<Record<DistrictKey, DistrictData>>;
  selected: DistrictKey;
  onSelect: (key: DistrictKey) => void;
  label: string;
  /** Fallback names used only when the cache has no entry for a district. */
  fallbackNames: Record<DistrictKey, { name: string; nameUrdu: string }>;
  /** "Selected" in the active language, shown inside the pressed button. */
  selectedLabel: string;
}

export default function DistrictPicker({
  districts,
  selected,
  onSelect,
  label,
  fallbackNames,
  selectedLabel,
}: DistrictPickerProps) {
  return (
    <div>
      <h2 id="district-label">{label}</h2>
      <div
        className="picker"
        role="group"
        aria-labelledby="district-label"
      >
        {DISTRICT_KEYS.map((key) => {
          const d = districts[key];
          const name = d?.name ?? fallbackNames[key].name;
          const nameUrdu = d?.nameUrdu ?? fallbackNames[key].nameUrdu;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
            >
              {name}
              <span className="urdu-name" lang="ur">
                {nameUrdu}
              </span>
              {isSelected && (
                <span className="selected-mark">✓ {selectedLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
