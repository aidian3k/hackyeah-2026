import type { ReportStatus, ReporterType } from "@/api/types";
import { GminaSelect } from "@/components/GminaSelect";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { REPORTER_TYPE_LABELS, REPORT_STATUS_LABELS } from "@/lib/labels";
import "@/styles/panel-reports.css";

/** Zakładka dopasowania: domyślnie „Bez dopasowania” (najcenniejsze dane: luka w korpusie). */
export type MatchedFilter = "false" | "all" | "true";

/** Stan listy zgłoszeń trzymany w parametrach URL (nazwy jak w GET /api/reports). */
export interface ReportParams {
  matched: MatchedFilter;
  status: ReportStatus | null;
  category: string | null;
  gmina: string | null;
  reporterType: ReporterType | null;
  offset: number;
}

export type ReportFilterPatch = Partial<Omit<ReportParams, "offset">>;

const MATCHED_TABS: { value: MatchedFilter; label: string }[] = [
  { value: "false", label: "Bez dopasowania" },
  { value: "all", label: "Wszystkie" },
  { value: "true", label: "Z dopasowaniem" },
];

const STATUSES = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[];
const REPORTER_TYPES = Object.keys(REPORTER_TYPE_LABELS) as ReporterType[];

function isStatus(v: string | null): v is ReportStatus {
  return v !== null && (STATUSES as string[]).includes(v);
}

function isReporterType(v: string | null): v is ReporterType {
  return v !== null && (REPORTER_TYPES as string[]).includes(v);
}

/** Czyta parametry z URL; wartości spoza zakresu API są pomijane (bez 422). */
export function readReportParams(sp: URLSearchParams): ReportParams {
  const matched = sp.get("matched");
  const status = sp.get("status");
  const reporterType = sp.get("reporter_type");
  const offset = sp.get("offset");
  return {
    matched: matched === "true" || matched === "all" ? matched : "false",
    status: isStatus(status) ? status : null,
    category: sp.get("category") || null,
    gmina: sp.get("gmina") || null,
    reporterType: isReporterType(reporterType) ? reporterType : null,
    offset: offset !== null && /^\d+$/.test(offset) ? Number(offset) : 0,
  };
}

/** Zapis stanu do URL. `matched` jest zawsze jawne, żeby link było widać i dało się go wkleić. */
export function writeReportParams(p: ReportParams): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("matched", p.matched);
  if (p.status) sp.set("status", p.status);
  if (p.category) sp.set("category", p.category);
  if (p.gmina) sp.set("gmina", p.gmina);
  if (p.reporterType) sp.set("reporter_type", p.reporterType);
  if (p.offset > 0) sp.set("offset", String(p.offset));
  return sp;
}

/** Czy poza zakładką dopasowania jest włączony jakikolwiek filtr. */
export function hasExtraFilters(p: ReportParams): boolean {
  return p.status !== null || p.category !== null || p.gmina !== null || p.reporterType !== null;
}

/** Opis filtra do podpisu tabeli, np. „Zgłoszenia bez dopasowania · status: Nowe · gmina: Bochnia”. */
export function describeReportFilters(p: ReportParams, categoryLabel: (code: string) => string): string {
  const head =
    p.matched === "false"
      ? "Zgłoszenia bez dopasowania"
      : p.matched === "true"
        ? "Zgłoszenia z dopasowaniem"
        : "Wszystkie zgłoszenia";
  const parts = [head];
  if (p.status) parts.push(`status: ${REPORT_STATUS_LABELS[p.status]}`);
  if (p.category) parts.push(`wyzwanie: ${categoryLabel(p.category)}`);
  if (p.gmina) parts.push(`gmina: ${p.gmina}`);
  if (p.reporterType) parts.push(`zgłaszający: ${REPORTER_TYPE_LABELS[p.reporterType]}`);
  return parts.join(" · ");
}

interface Props {
  params: ReportParams;
  /** Zmiana filtra; strona sama wraca na pierwszą stronę wyników. */
  onChange(patch: ReportFilterPatch): void;
  onClear(): void;
}

export function ReportFilters({ params, onChange, onClear }: Props) {
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const taxonomyKnown = params.category === null || taxonomy.some((t) => t.code === params.category);

  return (
    <section className="report-filters ds-stack" aria-labelledby="report-filters-title">
      <h2 id="report-filters-title" className="ds-sr-only">
        Filtry
      </h2>
      <div className="report-filters__tabs" role="group" aria-labelledby="report-filters-matched">
        <p id="report-filters-matched" className="ds-label">
          Dopasowanie
        </p>
        <div className="ds-cluster">
          {MATCHED_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className="ds-chip"
              aria-pressed={params.matched === tab.value}
              onClick={() => onChange({ matched: tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="report-filters__selects">
        <div className="ds-field">
          <label className="ds-label" htmlFor="reports-status">
            Status
          </label>
          <select
            id="reports-status"
            className="ds-select"
            value={params.status ?? ""}
            onChange={(e) => onChange({ status: isStatus(e.target.value) ? e.target.value : null })}
          >
            <option value="">Dowolny</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {REPORT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="reports-category">
            Wyzwanie
          </label>
          <select
            id="reports-category"
            className="ds-select"
            value={params.category ?? ""}
            onChange={(e) => onChange({ category: e.target.value || null })}
            aria-describedby={taxonomyError ? "reports-category-error" : undefined}
          >
            <option value="">Dowolne</option>
            {taxonomy.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
            {/* Kod z URL, którego jeszcze (albo wcale) nie ma na liście — wybór nie znika. */}
            {!taxonomyKnown && params.category && <option value={params.category}>{params.category}</option>}
          </select>
          {taxonomyError && (
            <p className="ds-error" id="reports-category-error">
              Nie udało się wczytać listy wyzwań. Pozostałe filtry działają.
            </p>
          )}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="reports-reporter">
            Zgłaszający
          </label>
          <select
            id="reports-reporter"
            className="ds-select"
            value={params.reporterType ?? ""}
            onChange={(e) =>
              onChange({ reporterType: isReporterType(e.target.value) ? e.target.value : null })
            }
          >
            <option value="">Dowolny</option>
            {REPORTER_TYPES.map((r) => (
              <option key={r} value={r}>
                {REPORTER_TYPE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <GminaSelect id="reports-gmina" label="Gmina" value={params.gmina} onChange={(gmina) => onChange({ gmina })} />
      </div>

      {(hasExtraFilters(params) || params.matched !== "false") && (
        <div>
          <button type="button" className="ds-btn" onClick={onClear}>
            Wyczyść filtry
          </button>
        </div>
      )}
    </section>
  );
}
