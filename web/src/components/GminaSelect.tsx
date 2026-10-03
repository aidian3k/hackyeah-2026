import { useMemo, type ChangeEvent } from "react";
import type { GminaItem } from "@/api/types";
import { useGminy } from "@/hooks/useGminy";

interface Props {
  id: string;
  value: string | null;
  onChange(v: string | null): void;
  label: string;
  hint?: string;
  error?: string;
}

interface Group {
  powiat: string;
  gminy: GminaItem[];
}

const byPl = (a: string, b: string) => a.localeCompare(b, "pl");

function groupByPowiat(items: GminaItem[]): Group[] {
  const map = new Map<string, GminaItem[]>();
  for (const g of items) {
    const list = map.get(g.powiat);
    if (list) list.push(g);
    else map.set(g.powiat, [g]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => byPl(a, b))
    .map(([powiat, gminy]) => ({ powiat, gminy: [...gminy].sort((a, b) => byPl(a.name, b.name)) }));
}

/** Natywna lista gmin pogrupowana po powiatach. Zwraca wyłącznie nazwę z /api/gminy albo null. */
export function GminaSelect({ id, value, onChange, label, hint, error }: Props) {
  const { items, error: loadError } = useGminy();
  const groups = useMemo(() => groupByPowiat(items), [items]);
  const names = useMemo(() => new Set(items.map((g) => g.name)), [items]);

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const loadErrorId = `${id}-load-error`;
  const describedBy =
    [hint && hintId, error && errorId, loadError && loadErrorId].filter(Boolean).join(" ") || undefined;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onChange(v && names.has(v) ? v : null);
  };

  return (
    <div className="ds-field">
      <label className="ds-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="ds-hint" id={hintId}>
          {hint}
        </p>
      )}
      <select
        id={id}
        className="ds-select"
        value={value && names.has(value) ? value : ""}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        <option value="">Nie wybrano</option>
        {groups.map((g) => (
          <optgroup key={g.powiat} label={`powiat ${g.powiat}`}>
            {g.gminy.map((gm) => (
              <option key={gm.name} value={gm.name}>
                {gm.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {loadError && (
        <p className="ds-error" id={loadErrorId}>
          Nie udało się wczytać listy gmin. Możesz pominąć to pole.
        </p>
      )}
      {error && (
        <p className="ds-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
