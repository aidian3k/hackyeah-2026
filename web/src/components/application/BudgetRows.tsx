import { useId, useRef } from "react";
import type { BudgetPhase, BudgetRow } from "@/api/types";
import { Alert } from "@/components/Alert";

/** Lustra limitów z api/config.py i schematu `BudgetRow` (api/kreator/schemas.py). */
export const APPLICATION_BUDGET_MAX_ROWS = 30;
const ACTION_MAX_CHARS = 300;
const WHEN_MAX_CHARS = 100;
const COST_MAX = 10_000_000;

/** Etapy planu działania (pkt 9 wzoru IWS) — etykiety wierszy „Faza I testu” / „Faza II testu”. */
export const BUDGET_PHASE_LABELS: Record<BudgetPhase, string> = {
  prep: "Okres przygotowawczy",
  test_1: "Faza I testu",
  test_2: "Faza II testu",
};

/** Wiersz w edycji: koszt jako tekst pola, `key` stabilny dla Reacta. */
export interface BudgetRowDraft {
  key: number;
  action: string;
  when: string;
  cost: string;
  phase: BudgetPhase;
}

let nextKey = 1;

export function toDraftRows(rows: BudgetRow[]): BudgetRowDraft[] {
  return rows.map((r) => ({
    key: nextKey++,
    action: r.action,
    when: r.when,
    cost: r.cost ? String(r.cost) : "",
    phase: r.phase ?? "prep",
  }));
}

export function parseCost(value: string): number {
  const digits = value.replace(/\s/g, "");
  if (!/^\d+$/.test(digits)) return 0;
  return Math.min(Number(digits), COST_MAX);
}

/** Wiersze do zapisu: bez wierszy bez nazwy działania (API wymaga 1–300 znaków). */
export function completeRows(rows: BudgetRowDraft[]): BudgetRow[] {
  return rows
    .filter((r) => r.action.trim() !== "")
    .map((r) => ({
      action: r.action.trim().slice(0, ACTION_MAX_CHARS),
      when: r.when.trim().slice(0, WHEN_MAX_CHARS),
      cost: parseCost(r.cost),
      phase: r.phase,
    }));
}

const moneyFmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

export function formatMoney(value: number): string {
  return `${moneyFmt.format(value)} zł`;
}

interface Props {
  /** Wiersze tej tabeli (już odfiltrowane po `phases`). */
  rows: BudgetRowDraft[];
  onChange: (rows: BudgetRowDraft[]) => void;
  /** Łączna liczba wierszy wniosku — limit `APPLICATION_BUDGET_MAX_ROWS` dotyczy całego budżetu. */
  totalRows?: number;
  /** Etapy wierszy w tej tabeli; więcej niż jeden = wybór fazy w wierszu. Brak = nabór bez podziału na etapy. */
  phases?: BudgetPhase[];
  /** Id kotwicy sekcji (`sekcja-…`). */
  anchorId?: string;
  title?: string;
  intro?: string;
  /** Limit naboru — podany pokazuje sumę i ostrzeżenie (nabór bez sekcji `total`). */
  maxAmount?: number;
  /** Komunikat 422 dla budżetu (`budget: …`). */
  error?: string | null;
}

/** Plan działania i koszty: działanie, termin, koszt (i faza testu); suma tej części na żywo. */
export function BudgetRows({
  rows,
  onChange,
  totalRows,
  phases,
  anchorId = "sekcja-budzet",
  title = "Plan działań i koszty",
  intro = "Wypisz działania, termin i koszt każdego z nich. Wiersze z kosztów kanwy dodaliśmy wstępnie, uzupełnij kwoty.",
  maxAmount,
  error,
}: Props) {
  const headingId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const total = rows.reduce((sum, r) => sum + parseCost(r.cost), 0);
  const over = maxAmount !== undefined && total > maxAmount;
  const full = (totalRows ?? rows.length) >= APPLICATION_BUDGET_MAX_ROWS;
  const choosePhase = phases !== undefined && phases.length > 1;

  function update(key: number, patch: Partial<BudgetRowDraft>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function add() {
    if (full) return;
    const phase = rows[rows.length - 1]?.phase ?? phases?.[0] ?? "prep";
    onChange([...rows, { key: nextKey++, action: "", when: "", cost: "", phase }]);
    // Fokus na nazwę działania w nowym wierszu, gdy React go wyrenderuje.
    requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll<HTMLInputElement>("input[data-field='action']");
      inputs?.[inputs.length - 1]?.focus();
    });
  }

  function remove(key: number) {
    onChange(rows.filter((r) => r.key !== key));
    addRef.current?.focus();
  }

  return (
    <section id={anchorId} aria-labelledby={headingId} className="ds-card flex scroll-mt-4 flex-col gap-4">
      <h2 id={headingId} tabIndex={-1} className="m-0 font-sans text-h3 text-navy">
        {title}
      </h2>
      <p className="m-0 text-body text-ink">{intro}</p>

      {rows.length === 0 && <p className="m-0 text-body text-ink-muted">Nie ma jeszcze żadnego wiersza.</p>}
      {rows.length > 0 && (
        <ol ref={listRef} className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((row, i) => (
            <li key={row.key}>
              <fieldset className="m-0 flex flex-col gap-3 rounded-md border border-solid border-line p-3 md:flex-row md:items-end">
                <legend className="px-1 text-label text-ink">Wiersz {i + 1}</legend>
                <div className="ds-field md:flex-[3]">
                  <label htmlFor={`budzet-${row.key}-action`} className="ds-label">
                    Działanie
                  </label>
                  <input
                    id={`budzet-${row.key}-action`}
                    data-field="action"
                    className="ds-input"
                    value={row.action}
                    maxLength={ACTION_MAX_CHARS}
                    onChange={(e) => update(row.key, { action: e.target.value })}
                  />
                </div>
                {choosePhase && (
                  <div className="ds-field md:flex-[2]">
                    <label htmlFor={`budzet-${row.key}-phase`} className="ds-label">
                      Faza
                    </label>
                    <select
                      id={`budzet-${row.key}-phase`}
                      className="ds-select"
                      value={row.phase}
                      onChange={(e) => update(row.key, { phase: e.target.value as BudgetPhase })}
                    >
                      {(phases ?? []).map((p) => (
                        <option key={p} value={p}>
                          {BUDGET_PHASE_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="ds-field md:flex-[2]">
                  <label htmlFor={`budzet-${row.key}-when`} className="ds-label">
                    Termin
                  </label>
                  <input
                    id={`budzet-${row.key}-when`}
                    className="ds-input"
                    value={row.when}
                    maxLength={WHEN_MAX_CHARS}
                    placeholder="np. styczeń 2027"
                    onChange={(e) => update(row.key, { when: e.target.value })}
                  />
                </div>
                <div className="ds-field md:flex-[2]">
                  <label htmlFor={`budzet-${row.key}-cost`} className="ds-label">
                    Koszt w zł
                  </label>
                  <input
                    id={`budzet-${row.key}-cost`}
                    className="ds-input"
                    inputMode="numeric"
                    autoComplete="off"
                    value={row.cost}
                    onChange={(e) => update(row.key, { cost: e.target.value.replace(/[^\d\s]/g, "") })}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    className="ds-btn ds-btn--link"
                    onClick={() => remove(row.key)}
                    aria-label={`Usuń wiersz ${i + 1}${row.action.trim() ? `: ${row.action.trim().slice(0, 60)}` : ""}`}
                  >
                    Usuń
                  </button>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-1">
        <div>
          <button ref={addRef} type="button" className="ds-btn" onClick={add} aria-disabled={full}>
            Dodaj wiersz
          </button>
        </div>
        {full && <p className="ds-hint">Możesz dodać najwyżej {APPLICATION_BUDGET_MAX_ROWS} wierszy.</p>}
        <p className="ds-hint">Wiersz bez nazwy działania nie zostanie zapisany.</p>
      </div>

      {maxAmount === undefined ? (
        <p className="m-0 text-body text-ink">
          <strong>Razem w tej części: {formatMoney(total)}</strong>
        </p>
      ) : (
        <>
          <p className="m-0 text-body-lg text-ink">
            <strong>Suma: {formatMoney(total)}</strong> z limitu naboru {formatMoney(maxAmount)}
          </p>
          <div aria-live="polite">
            {over && (
              <Alert tone="warning">
                Suma kosztów przekracza limit naboru o {formatMoney(total - maxAmount)}. Zmniejsz koszty albo usuń część działań.
              </Alert>
            )}
          </div>
        </>
      )}
      {error && <p className="ds-error m-0">{error}</p>}
    </section>
  );
}
