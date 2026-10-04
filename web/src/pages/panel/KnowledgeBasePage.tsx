import { useId, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { AdminSolutionsQuery, Page, SolutionAdminItem, SolutionStatus } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime, plural } from "@/lib/format";
import { KIND_LABELS, KNOWLEDGE_TYPE_LABELS, SOLUTION_STATUS_LABELS } from "@/lib/labels";

const PAGE_SIZE = 25;

// Filtr rodzaju w adresie (?rodzaj=…): łączy kind i knowledge_type.
const KIND_FILTERS: { value: string; label: string; query: Pick<AdminSolutionsQuery, "kind" | "knowledge_type"> }[] = [
  { value: "", label: "Wszystkie", query: {} },
  { value: "rozwiazania", label: "Rozwiązania", query: { kind: "SOLUTION" } },
  { value: "wiedza", label: "Wiedza", query: { kind: "KNOWLEDGE" } },
  { value: "raporty", label: "Raporty", query: { kind: "KNOWLEDGE", knowledge_type: "REPORT" } },
  { value: "materialy", label: "Materiały", query: { kind: "KNOWLEDGE", knowledge_type: "MATERIAL" } },
];

const STATUSES = Object.keys(SOLUTION_STATUS_LABELS) as SolutionStatus[];

function parseOffset(raw: string | null): number {
  const n = raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(n) ? n : 0;
}

function kindLabel(item: SolutionAdminItem): string {
  if (item.kind === "KNOWLEDGE" && item.knowledge_type) return KNOWLEDGE_TYPE_LABELS[item.knowledge_type];
  return KIND_LABELS[item.kind];
}

/** Panel: cała baza wpisów (wszystkie statusy) z filtrami w adresie: ?rodzaj=…&status=…&q=…&offset=… */
export function KnowledgeBasePage() {
  useDocumentTitle("Panel: Baza wiedzy");
  const uid = useId();
  const [params, setParams] = useSearchParams();
  const kindFilter = KIND_FILTERS.find((k) => k.value === (params.get("rodzaj") ?? "")) ?? KIND_FILTERS[0]!;
  const rawStatus = params.get("status");
  const status = STATUSES.find((s) => s === rawStatus);
  const q = params.get("q")?.trim() ?? "";
  const offset = parseOffset(params.get("offset"));
  const [draft, setDraft] = useState(q);

  const { data, error, loading, reload } = useApi<Page<SolutionAdminItem>>(
    () => api.adminSolutions({ ...kindFilter.query, status, q: q || undefined, limit: PAGE_SIZE, offset }),
    [kindFilter.value, status, q, offset],
  );

  function update(next: { rodzaj?: string; status?: string; q?: string; offset?: number }) {
    const p = new URLSearchParams();
    const values = { rodzaj: kindFilter.value, status: status ?? "", q, ...next };
    if (values.rodzaj) p.set("rodzaj", values.rodzaj);
    if (values.status) p.set("status", values.status);
    if (values.q) p.set("q", values.q);
    if (next.offset) p.set("offset", String(next.offset));
    setParams(p);
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    update({ q: draft.trim() });
  }

  const filtered = Boolean(kindFilter.value || status || q);

  return (
    <div className="ds-page">
      <header className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Baza wiedzy</h1>
        <p className="m-0">
          Wszystkie rozwiązania i materiały wiedzy, także te czekające na zatwierdzenie. Zmiana tytułu, streszczenia
          lub treści od razu odświeża wyszukiwanie w czacie.
        </p>
        <div>
          <Link className="ds-btn ds-btn--cta" to="/panel/wiedza/nowy">
            Dodaj wpis
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className="ds-stack" role="group" aria-labelledby={`${uid}-kind`}>
          <p id={`${uid}-kind`} className="ds-label">
            Rodzaj
          </p>
          <div className="ds-cluster">
            {KIND_FILTERS.map((k) => (
              <button
                key={k.value}
                type="button"
                className="ds-chip"
                aria-pressed={kindFilter.value === k.value}
                onClick={() => update({ rodzaj: k.value })}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="ds-field">
            <label className="ds-label" htmlFor={`${uid}-status`}>
              Status
            </label>
            <select
              id={`${uid}-status`}
              className="ds-select"
              value={status ?? ""}
              onChange={(e) => update({ status: e.target.value })}
            >
              <option value="">Wszystkie</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SOLUTION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <form className="flex flex-wrap items-end gap-3" role="search" onSubmit={search}>
            <div className="ds-field">
              <label className="ds-label" htmlFor={`${uid}-q`}>
                Tytuł zawiera
              </label>
              <input
                id={`${uid}-q`}
                className="ds-input"
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <button type="submit" className="ds-btn">
              Szukaj
            </button>
          </form>
        </div>
      </div>

      <section className="ds-stack" aria-labelledby={`${uid}-results`}>
        <h2 id={`${uid}-results`}>Wpisy</h2>
        <LoadState loading={loading && !data} error={error} onRetry={reload} label="Wczytujemy wpisy…">
          {data && (
            <>
              <p className="m-0" aria-live="polite">
                {data.total} {plural(data.total, "wpis", "wpisy", "wpisów")}
              </p>
              {data.items.length === 0 ? (
                <EmptyState title={filtered ? "Żaden wpis nie pasuje do filtrów." : "Baza jest pusta."}>
                  {filtered ? (
                    <p>
                      <button type="button" className="ds-btn ds-btn--link" onClick={() => {
                          setDraft("");
                          setParams(new URLSearchParams());
                        }}>
                        Wyczyść filtry
                      </button>
                    </p>
                  ) : (
                    <p>Dodaj pierwszy wpis przyciskiem „Dodaj wpis”.</p>
                  )}
                </EmptyState>
              ) : (
                <div className="ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th scope="col">Tytuł</th>
                        <th scope="col">Rodzaj</th>
                        <th scope="col">Status</th>
                        <th scope="col">Ostatnia zmiana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => (
                        <tr key={item.id}>
                          <td className="[overflow-wrap:anywhere]">
                            <Link to={`/panel/wiedza/${item.id}`}>{item.title}</Link>
                          </td>
                          <td>{kindLabel(item)}</td>
                          <td>{SOLUTION_STATUS_LABELS[item.status]}</td>
                          <td>{formatDateTime(item.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                total={data.total}
                limit={data.limit}
                offset={data.offset}
                onChange={(o) => update({ offset: o })}
              />
            </>
          )}
        </LoadState>
      </section>
    </div>
  );
}
