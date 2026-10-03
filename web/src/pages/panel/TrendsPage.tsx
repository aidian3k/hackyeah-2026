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
const TOP_GMINY = 10;

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

function gminaHref(name: string): string {
  return `/panel/zgloszenia?${new URLSearchParams({ gmina: name }).toString()}`;
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
  const gminy = stats.by_gmina.slice(0, TOP_GMINY);

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

      <section aria-labelledby="trends-gminy" className="ds-stack">
        <h2 id="trends-gminy">Gminy z największą liczbą zgłoszeń</h2>
        {stats.by_gmina.length > TOP_GMINY && (
          <p>
            Pokazujemy {TOP_GMINY} z {stats.by_gmina.length} pozycji.
          </p>
        )}
        {/* Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu). */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="ds-table-wrap" role="region" aria-labelledby="trends-gminy-caption" tabIndex={0}>
          <table className="ds-table">
            <caption id="trends-gminy-caption">
              Gminy według liczby zgłoszeń {range.phrase}
            </caption>
            <thead>
              <tr>
                <th scope="col">Gmina</th>
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
              {gminy.map((g) => (
                <tr key={g.gmina ?? "__none"}>
                  <th scope="row">{g.gmina ? <Link to={gminaHref(g.gmina)}>{g.gmina}</Link> : "Gmina nie podana"}</th>
                  <td>{g.powiat ?? ""}</td>
                  <td className="ds-table__num">{g.total}</td>
                  <td className="ds-table__num">{g.unmatched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// F18: agregaty potrzeb regionu (tylko panel). Grupy by_week i by_reporter_type w PoC pomijamy.
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
    </div>
  );
}
