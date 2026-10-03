import { useEffect, useId, useState, type FormEvent } from "react";
import type { TaxonomyItem } from "@/api/types";
import type { LibraryOverview } from "@/hooks/useLibraryOverview";
import { ropsGroupByTag } from "@/lib/ropsGroups";

/** Stan katalogu w parametrach URL (q, tag, category jak w GET /api/solutions; has_video — filtr Biblioteki). */
export interface CatalogParams {
  q: string;
  tag: string | null;
  category: string | null;
  hasVideo: boolean;
  offset: number;
}

const SEARCH_DEBOUNCE_MS = 300;

function positiveInt(v: string | null): number | null {
  if (v === null || !/^\d+$/.test(v)) return null;
  return Number(v);
}

/** Czyta parametry z URL. Dawne parametry (gmina, evidence_min, sort) są ignorowane. */
export function readCatalogParams(sp: URLSearchParams): CatalogParams {
  return {
    q: (sp.get("q") ?? "").trim(),
    tag: sp.get("tag") || null,
    category: sp.get("category") || null,
    hasVideo: sp.get("has_video") === "true",
    offset: positiveInt(sp.get("offset")) ?? 0,
  };
}

/** Zapis stanu do URL: wartości domyślne nie trafiają do adresu. */
export function writeCatalogParams(p: CatalogParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.tag) sp.set("tag", p.tag);
  if (p.category) sp.set("category", p.category);
  if (p.hasVideo) sp.set("has_video", "true");
  if (p.offset > 0) sp.set("offset", String(p.offset));
  return sp;
}

export function activeFilterCount(p: CatalogParams): number {
  return [p.q, p.tag, p.category, p.hasVideo || null].filter((v) => v !== null && v !== "").length;
}

/** Wyszukiwarka na pierwszym planie: lokalny tekst, do URL po 300 ms bezczynności albo Enter. */
export function CatalogSearch({ q, onChange }: { q: string; onChange(q: string): void }) {
  const id = useId();
  // „Wstecz” zmienia q w URL → pole przyjmuje nową wartość (wzorzec „poprzedni prop” w renderze).
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    if (text.trim() !== q) setText(q);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === q) return;
    const timer = window.setTimeout(() => onChange(next), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, q, onChange]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = text.trim();
    if (next !== q) onChange(next);
  };

  return (
    <form role="search" onSubmit={submit} className="max-w-2xl">
      <div className="ds-field">
        <label className="ds-label" htmlFor={`${id}-q`}>
          Szukaj innowacji
        </label>
        <p className="ds-hint" id={`${id}-hint`}>
          Np. „samotność”, „niewidomi”, „opiekun”. Wyniki odświeżą się same, gdy przestaniesz pisać.
        </p>
        <input
          id={`${id}-q`}
          className="ds-input"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
        />
      </div>
    </form>
  );
}

/** „Dla kogo”: 9 grup ROPS jako przełączniki z licznikami; jedna grupa naraz. */
export function GroupChips({
  groups,
  value,
  onChange,
}: {
  groups: LibraryOverview["groups"];
  value: string | null;
  onChange(tag: string | null): void;
}) {
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend id={id} className="mb-2 p-0 font-sans text-h3 text-navy">
        Dla kogo?
      </legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ds-chip" aria-pressed={value === null} onClick={() => onChange(null)}>
          Wszystkie
        </button>
        {groups.map((g) => {
          const label = ropsGroupByTag(g.tag)?.label ?? g.tag;
          return (
            <button
              key={g.tag}
              type="button"
              className="ds-chip"
              aria-pressed={value === g.tag}
              onClick={() => onChange(value === g.tag ? null : g.tag)}
            >
              {label} <span className="font-normal">({g.count})</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface FiltersProps {
  params: CatalogParams;
  categories: TaxonomyItem[];
  /** Kod wyzwania → liczba innowacji; wyzwania bez innowacji nie są proponowane. */
  categoryCounts: Map<string, number> | null;
  withVideo: number | null;
  onChange(patch: Partial<Omit<CatalogParams, "offset">>): void;
  onClear(): void;
}

/** Filtry dodatkowe: wyzwanie i „Tylko z filmem”. */
export function CatalogFilters({ params, categories, categoryCounts, withVideo, onChange, onClear }: FiltersProps) {
  const id = useId();
  const available = categories.filter((t) => t.code !== "OTHER" && (categoryCounts?.get(t.code) ?? 0) > 0);
  const active = activeFilterCount(params);

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="ds-field min-w-[min(100%,18rem)]">
        <label className="ds-label" htmlFor={`${id}-category`}>
          Wyzwanie społeczne
        </label>
        <select
          id={`${id}-category`}
          className="ds-select"
          value={params.category ?? ""}
          onChange={(e) => onChange({ category: e.target.value || null })}
        >
          <option value="">Wszystkie wyzwania</option>
          {available.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label_pl} ({categoryCounts?.get(t.code)})
            </option>
          ))}
        </select>
      </div>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-body text-ink">
        <input
          type="checkbox"
          className="h-5 w-5 accent-navy"
          checked={params.hasVideo}
          onChange={(e) => onChange({ hasVideo: e.target.checked })}
        />
        Tylko z filmem{withVideo !== null && ` (${withVideo})`}
      </label>

      {active > 0 && (
        <button type="button" className="ds-btn ds-btn--link px-0" onClick={onClear}>
          Wyczyść filtry
        </button>
      )}
    </div>
  );
}
