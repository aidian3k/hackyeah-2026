import type { ReporterType } from "@/api/types";
import { REPORTER_TYPE_LABELS } from "@/lib/labels";

interface Props {
  name: string;
  value: ReporterType;
  onChange(v: ReporterType): void;
}

// Trzy proste wybory + „Nie chcę podawać” (OTHER, domyślnie zaznaczone).
const OPTIONS: ReporterType[] = ["RESIDENT", "NGO", "JST", "OTHER"];

/** „Zgłaszam jako (opcjonalnie)” — grupa radio ds-choices; brak wyboru = OTHER. */
export function ReporterTypeField({ name, value, onChange }: Props) {
  return (
    <fieldset className="ds-choices ds-choices--inline chat-form__reporter">
      <legend className="ds-choices__legend">Zgłaszam jako (opcjonalnie)</legend>
      {OPTIONS.map((option) => (
        <label key={option} className="ds-choice">
          <input
            className="ds-choice__input"
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {REPORTER_TYPE_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
