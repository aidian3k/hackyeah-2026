import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { Stats } from "@/api/types";
import { BarList, CATEGORY_BAR_CLASS, type BarItem } from "@/components/panel/BarList";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate, plural } from "@/lib/format";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import "@/styles/panel.css";

// Zakres trzymamy w URL (?range=…), żeby działał „Wstecz” i dało się wkleić link.
export const RANGES = [
  { value: "30d", label: "30 dni", days: 30, phrase: "z ostatnich 30 dni" },
  { value: "90d", label: "90 dni", days: 90, phrase: "z ostatnich 90 dni" },
  { value: "1y", label: "Rok", days: 365, phrase: "z ostatniego roku" },
] as const;
type Range = (typeof RANGES)[number];
const DEFAULT_RANGE = RANGES[1];
const TOP_POWIATY = 10;

/** Data lokalna jako RRRR-MM-DD (format parametru from/to w /api/stats). */
function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function rangeDates(range: Range): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - range.days);
  return { from: isoDay(from), to: isoDay(to) };
}

const percentFmt = new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 0 });
function percent(part: number, total: number): string | null {
  return total > 0 ? percentFmt.format(part / total) : null;
}

const weekFmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" });
function weekLabel(iso: string): string {
  const d = new Date(iso);
  return `Tydzień od ${Number.isNaN(d.getTime()) ? iso : weekFmt.format(d)}`;
}

function reportsCount(n: number): string {
  return `${n} ${plural(n, "zgłoszenie", "zgłoszenia", "zgłoszeń")}`;
}

function Tile({ value, label, note, children }: { value: number; label: string; note?: string | null; children?: ReactNode }) {
  return (
    <li>
      <div className="ds-card ds-stack inbox-tile">
        <p className="inbox-tile__value">{value}</p>
        <p className="inbox-tile__label">
          {label}
          {note && <> ({note})</>}
        </p>
        {children}
      </div>
    </li>
  );
}

function categoryHref(code: string): string {
  return `/panel/zgloszenia?${new URLSearchParams({ category: code }).toString()}`;
}

function gapHref(code: string): string {
  return `/panel/zgloszenia?${new URLSearchParams({ category: code, matched: "false" }).toString()}`;
}

export function TrendsContent({ stats, range }: { stats: Stats; range: Range }) {
  if (stats.total === 0) {
    return (
      <EmptyState title={`Nie ma zgłoszeń ${range.phrase}.`}>
        <p>Wybierz dłuższy zakres albo wróć tu, gdy mieszkańcy opiszą swoje problemy w czacie.</p>
      </EmptyState>
    );
  }

  const categories = stats.by_category.map((c) => ({
    ...c,
    name: c.label_pl ?? (c.category ? c.category : "Bez przypisanego wyzwania"),
  }));
  const bars: BarItem[] = categories.map((c) => ({
    key: c.category ?? "__none",
    label: c.category ? <Link to={categoryHref(c.category)}>{c.name}</Link> : c.name,
    total: c.total,
    matched: c.matched,
    unmatched: c.unmatched,
    colorClass: c.category ? CATEGORY_BAR_CLASS[c.category] : null,
  }));
  const weeks: BarItem[] = stats.by_week.map((w) => ({
    key: w.week,
    label: weekLabel(w.week),
    total: w.total,
    matched: w.matched,
    unmatched: w.unmatched,
    colorClass: "ds-bar--navy",
  }));
  const powiaty = stats.by_powiat.slice(0, TOP_POWIATY);

  return (
    <>
      <section aria-labelledby="trends-counts" className="ds-stack">
        <h2 id="trends-counts" className="ds-sr-only">
          Podsumowanie zakresu
        </h2>
        <ul className="ds-grid card-list">
          <Tile value={stats.total} label={plural(stats.total, "Zgłoszenie", "Zgłoszenia", "Zgłoszeń")} />
          <Tile value={stats.matched} label="Z dopasowaniem" note={percent(stats.matched, stats.total)} />
          <Tile value={stats.unmatched} label="Bez dopasowania" note={percent(stats.unmatched, stats.total)}>
            <p>To luka w bibliotece: dla tych problemów nie mamy jeszcze rozwiązania.</p>
            {stats.unmatched > 0 && <Link to="/panel/zgloszenia?matched=false">Zobacz zgłoszenia bez dopasowania</Link>}
          </Tile>
        </ul>
      </section>

      {weeks.length > 0 && (
        <section aria-labelledby="trends-weeks" className="ds-stack">
          <h2 id="trends-weeks">Zgłoszenia w czasie</h2>
          <p>Liczba zgłoszeń w kolejnych tygodniach. Część wypełniona to zgłoszenia z dopasowaniem.</p>
          <BarList items={weeks} labelledBy="trends-weeks" />
        </section>
      )}

      <section aria-labelledby="trends-categories" className="ds-stack">
        <h2 id="trends-categories">Wyzwania</h2>
        <p>
          Długość słupka to liczba zgłoszeń. Część wypełniona to zgłoszenia z dopasowaniem, część z samym obrysem to
          zgłoszenia bez dopasowania.
        </p>
        <BarList items={bars} labelledBy="trends-categories" />
        <details>
          <summary>Pokaż jako tabelę</summary>
          {/* Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu). */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="ds-table-wrap" role="region" aria-labelledby="trends-categories-caption" tabIndex={0}>
            <table className="ds-table">
              <caption id="trends-categories-caption">Zgłoszenia według wyzwań {range.phrase}</caption>
              <thead>
                <tr>
                  <th scope="col">Wyzwanie</th>
                  <th scope="col" className="ds-table__num">
                    Razem
                  </th>
                  <th scope="col" className="ds-table__num">
                    Z dopasowaniem
                  </th>
                  <th scope="col" className="ds-table__num">
                    Bez dopasowania
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category ?? "__none"}>
                    <th scope="row">{c.category ? <Link to={categoryHref(c.category)}>{c.name}</Link> : c.name}</th>
                    <td className="ds-table__num">{c.total}</td>
                    <td className="ds-table__num">{c.matched}</td>
                    <td className="ds-table__num">{c.unmatched}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section aria-labelledby="trends-powiaty" className="ds-stack">
        <h2 id="trends-powiaty">Powiaty z największą liczbą zgłoszeń</h2>
        {stats.by_powiat.length > TOP_POWIATY && (
          <p>
            Pokazujemy {TOP_POWIATY} z {stats.by_powiat.length} pozycji.
          </p>
        )}
        {/* Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu). */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="ds-table-wrap" role="region" aria-labelledby="trends-powiaty-caption" tabIndex={0}>
          <table className="ds-table">
            <caption id="trends-powiaty-caption">Powiaty według liczby zgłoszeń {range.phrase}</caption>
            <thead>
              <tr>
                <th scope="col">Powiat</th>
                <th scope="col" className="ds-table__num">
                  Razem
                </th>
                <th scope="col" className="ds-table__num">
                  Bez dopasowania
                </th>
              </tr>
            </thead>
            <tbody>
              {powiaty.map((p) => (
                <tr key={p.powiat ?? "__none"}>
                  <th scope="row">{p.powiat ?? "Powiat nie podany"}</th>
                  <td className="ds-table__num">{p.total}</td>
                  <td className="ds-table__num">{p.unmatched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function GapMark() {
  return (
    <span className="ds-tag inline-flex items-center gap-1">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-4 w-4 fill-none stroke-current stroke-2">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      Luka
    </span>
  );
}

/** „Zgłoszenia a biblioteka”: gdzie mieszkańcy zgłaszają problemy, a biblioteka ma mało rozwiązań (ADR-M2-005). */
export function CoverageSection({ from, to }: { from: string; to: string }) {
  const { data, error, loading, reload } = useApi(() => api.coverage({ from, to }), [from, to]);
  return (
    <section aria-labelledby="trends-coverage" className="ds-stack">
      <h2 id="trends-coverage">Zgłoszenia a biblioteka</h2>
      <p>
        Luka oznacza wyzwanie z wieloma zgłoszeniami bez dopasowania i z małą liczbą rozwiązań w bibliotece. Liczby
        rozwiązań i wiedzy to stan na dziś.
      </p>
      <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy zestawienie…">
        {data && (
          // Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          <div className="ds-table-wrap" role="region" aria-labelledby="trends-coverage-caption" tabIndex={0}>
            <table className="ds-table">
              <caption id="trends-coverage-caption">Zgłoszenia i zasoby biblioteki według wyzwań</caption>
              <thead>
                <tr>
                  <th scope="col">Wyzwanie</th>
                  <th scope="col" className="ds-table__num">
                    Zgłoszenia
                  </th>
                  <th scope="col" className="ds-table__num">
                    Bez dopasowania
                  </th>
                  <th scope="col" className="ds-table__num">
                    Rozwiązania w bibliotece
                  </th>
                  <th scope="col" className="ds-table__num">
                    Wiedza
                  </th>
                  <th scope="col">Stan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{row.label_pl}</th>
                    <td className="ds-table__num">{row.reports_total}</td>
                    <td className="ds-table__num">{row.reports_unmatched}</td>
                    <td className="ds-table__num">{row.solutions_published}</td>
                    <td className="ds-table__num">{row.knowledge_published}</td>
                    <td>
                      {row.is_gap ? (
                        <span className="flex flex-col items-start gap-1">
                          <GapMark />
                          <Link to={gapHref(row.category)}>
                            Zobacz zgłoszenia<span className="ds-sr-only">: {row.label_pl}</span>
                          </Link>
                        </span>
                      ) : (
                        "Bez luki"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LoadState>
    </section>
  );
}

// F18 + Z09: agregaty potrzeb regionu (tylko panel): w czasie, po powiatach i zestawienie z biblioteką.
// Grupa by_reporter_type w PoC pomijana; gmina zniknęła z UI (docs/changes/bugs-2026-10-03-1).
export function TrendsPage() {
  useDocumentTitle("Panel: Trendy");
  const [searchParams, setSearchParams] = useSearchParams();
  const range = RANGES.find((r) => r.value === searchParams.get("range")) ?? DEFAULT_RANGE;
  const { from, to } = rangeDates(range);
  const { data, error, loading, reload } = useApi(() => api.stats({ from, to }), [from, to]);

  function selectRange(r: Range) {
    const next = new URLSearchParams(searchParams);
    if (r === DEFAULT_RANGE) next.delete("range");
    else next.set("range", r.value);
    setSearchParams(next);
  }

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Trendy</h1>
        <p>
          Jakie wyzwania zgłaszają gminy i mieszkańcy oraz czego brakuje w bibliotece rozwiązań. Kliknij nazwę wyzwania
          albo gminy, żeby zobaczyć te zgłoszenia.
        </p>
        <div className="ds-cluster" role="group" aria-label="Zakres czasu">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              className="ds-chip"
              aria-pressed={r === range}
              onClick={() => selectRange(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="ds-sr-only" aria-live="polite">
        {data && !loading ? `Pokazujemy zgłoszenia ${range.phrase}: ${reportsCount(data.total)}.` : ""}
      </p>

      <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy statystyki…">
        {data && (
          <>
            <p>
              Zgłoszenia od {formatDate(data.from)} do {formatDate(data.to)}.
            </p>
            <TrendsContent stats={data} range={range} />
          </>
        )}
      </LoadState>

      <CoverageSection from={from} to={to} />
    </div>
  );
}
