import { useEffect, useState, type FormEvent } from "react";
import { GminaSelect } from "@/components/GminaSelect";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { EVIDENCE_LABELS } from "@/lib/labels";
import "@/styles/catalog.css";

export type CatalogSort = "recent" | "evidence";

/** Stan katalogu trzymany w parametrach URL (nazwy jak w GET /api/solutions). */
export interface CatalogParams {
  q: string;
  category: string | null;
  gmina: string | null;
  evidenceMin: number | null;
  sort: CatalogSort;
  offset: number;
}

const SEARCH_DEBOUNCE_MS = 300;
const EVIDENCE_OPTIONS = [2, 3, 4, 5];
/** Szerokość, od której filtry są od razu rozwinięte (próg ds-nav, w em — rośnie z powiększeniem tekstu). */
const WIDE_QUERY = "(min-width: 56.25em)";

function positiveInt(v: string | null): number | null {
  if (v === null || !/^\d+$/.test(v)) return null;
  return Number(v);
}

/** Czyta i porządkuje parametry z URL; wartości spoza zakresu API są pomijane (bez 422). */
export function readCatalogParams(sp: URLSearchParams): CatalogParams {
  const evidence = positiveInt(sp.get("evidence_min"));
  return {
    q: (sp.get("q") ?? "").trim(),
    category: sp.get("category") || null,
    gmina: sp.get("gmina") || null,
    evidenceMin: evidence !== null && evidence >= 2 && evidence <= 5 ? evidence : null,
    sort: sp.get("sort") === "evidence" ? "evidence" : "recent",
    offset: positiveInt(sp.get("offset")) ?? 0,
  };
}

/** Zapis stanu do URL: wartości domyślne nie trafiają do adresu. */
export function writeCatalogParams(p: CatalogParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.category) sp.set("category", p.category);
  if (p.gmina) sp.set("gmina", p.gmina);
  if (p.evidenceMin !== null) sp.set("evidence_min", String(p.evidenceMin));
  if (p.sort !== "recent") sp.set("sort", p.sort);
  if (p.offset > 0) sp.set("offset", String(p.offset));
  return sp;
}

/** Liczba aktywnych filtrów (kolejność nie jest filtrem). */
export function activeFilterCount(p: CatalogParams): number {
  return [p.q, p.category, p.gmina, p.evidenceMin].filter((v) => v !== null && v !== "").length;
}

function evidenceOptionLabel(level: number): string {
  const label = EVIDENCE_LABELS[level] ?? "";
  return `Co najmniej ${label.charAt(0).toLowerCase()}${label.slice(1)} (${level})`;
}

function initiallyWide(): boolean {
  try {
    return window.matchMedia(WIDE_QUERY).matches;
  } catch {
    return true;
  }
}

interface Props {
  params: CatalogParams;
  /** Zmiana filtra; strona sama wraca na pierwszą stronę wyników. */
  onChange(patch: Partial<Omit<CatalogParams, "offset">>): void;
  onClear(): void;
}

export function CatalogFilters({ params, onChange, onClear }: Props) {
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const categories = taxonomy.filter((t) => t.code !== "OTHER");
  const active = activeFilterCount(params);
  const [open] = useState(initiallyWide);

  // Pole wyszukiwania: lokalny tekst, do URL po 300 ms bezczynności albo Enter.
  // „Wstecz” zmienia q w URL → pole przyjmuje nową wartość (wzorzec „poprzedni prop” w renderze).
  const [text, setText] = useState(params.q);
  const [syncedQ, setSyncedQ] = useState(params.q);
  if (syncedQ !== params.q) {
    setSyncedQ(params.q);
    if (text.trim() !== params.q) setText(params.q);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === params.q) return;
    const timer = window.setTimeout(() => onChange({ q: next }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, params.q, onChange]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = text.trim();
    if (next !== params.q) onChange({ q: next });
  };

  return (
    <details className="catalog-filters" open={open}>
      <summary className="catalog-filters__summary">
        Filtry <span aria-hidden="true">({active})</span>
        <span className="ds-sr-only">, aktywne: {active}</span>
      </summary>
      <div className="catalog-filters__body ds-stack">
        <form role="search" className="catalog-filters__search" onSubmit={submitSearch}>
          <div className="ds-field">
            <label className="ds-label" htmlFor="catalog-q">
              Szukaj w tytułach
            </label>
            <p className="ds-hint" id="catalog-q-hint">
              Wyniki odświeżą się same, gdy przestaniesz pisać.
            </p>
            <input
              id="catalog-q"
              className="ds-input"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-describedby="catalog-q-hint"
              autoComplete="off"
            />
          </div>
        </form>

        <fieldset className="catalog-filters__group">
          <legend className="ds-label">Wyzwanie</legend>
          {taxonomyError ? (
            <p className="ds-error">Nie udało się wczytać listy wyzwań. Pozostałe filtry działają.</p>
          ) : (
            <div className="ds-cluster">
              <button
                type="button"
                className="ds-chip"
                aria-pressed={params.category === null}
                onClick={() => onChange({ category: null })}
              >
                Wszystkie
              </button>
              {categories.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="ds-chip"
                  aria-pressed={params.category === t.code}
                  onClick={() => onChange({ category: params.category === t.code ? null : t.code })}
                >
                  {t.label_pl}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="catalog-filters__selects">
          <GminaSelect
            id="catalog-gmina"
            label="Gmina"
            value={params.gmina}
            onChange={(gmina) => onChange({ gmina })}
          />
          <div className="ds-field">
            <label className="ds-label" htmlFor="catalog-evidence">
              Poziom sprawdzenia
            </label>
            <select
              id="catalog-evidence"
              className="ds-select"
              value={params.evidenceMin ?? ""}
              onChange={(e) => onChange({ evidenceMin: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Dowolny</option>
              {EVIDENCE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {evidenceOptionLabel(n)}
                </option>
              ))}
            </select>
          </div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="catalog-sort">
              Kolejność
            </label>
            <select
              id="catalog-sort"
              className="ds-select"
              value={params.sort}
              onChange={(e) => onChange({ sort: e.target.value === "evidence" ? "evidence" : "recent" })}
            >
              <option value="recent">Najnowsze</option>
              <option value="evidence">Najlepiej sprawdzone</option>
            </select>
          </div>
        </div>

        {(active > 0 || params.sort !== "recent") && (
          <div>
            <button type="button" className="ds-btn" onClick={onClear}>
              Wyczyść filtry
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
