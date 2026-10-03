import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { Page, SolutionCard as SolutionCardData, SolutionStatus } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { plural } from "@/lib/format";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import "@/styles/components.css";

const PAGE_SIZE = 20;

const STATUS_TABS: { value: SolutionStatus; label: string; empty: string }[] = [
  { value: "PENDING_REVIEW", label: "Czekają", empty: "Nie ma pomysłów czekających na przejrzenie." },
  { value: "PUBLISHED", label: "Opublikowane", empty: "Nie ma opublikowanych rozwiązań." },
  { value: "REJECTED", label: "Odrzucone", empty: "Nie ma odrzuconych pomysłów." },
  { value: "ARCHIVED", label: "Zarchiwizowane", empty: "Nie ma rozwiązań w archiwum." },
];

function parseStatus(raw: string | null): SolutionStatus {
  return STATUS_TABS.find((t) => t.value === raw)?.value ?? "PENDING_REVIEW";
}

function parseOffset(raw: string | null): number {
  const n = raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(n) ? n : 0;
}

/** Panel: kolejka pomysłów z „Mam pomysł” i pozostałe statusy rozwiązań (filtr w adresie: ?status=…&offset=…). */
export function SolutionsQueuePage() {
  useDocumentTitle("Panel: Do zatwierdzenia");
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get("status"));
  const offset = parseOffset(params.get("offset"));
  const tab = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0]!;

  const { data, error, loading, reload } = useApi<Page<SolutionCardData>>(
    () => api.solutions({ status, limit: PAGE_SIZE, offset }),
    [status, offset],
  );

  function update(next: { status?: SolutionStatus; offset?: number }) {
    const s = next.status ?? status;
    const o = next.offset ?? 0;
    const p = new URLSearchParams();
    if (s !== "PENDING_REVIEW") p.set("status", s);
    if (o > 0) p.set("offset", String(o));
    setParams(p);
  }

  return (
    <div className="ds-page">
      <header className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Do zatwierdzenia</h1>
        <p>
          Pomysły z formularza „Mam pomysł” trafiają do biblioteki i do wyszukiwania dopiero po przejrzeniu
          i opublikowaniu.
        </p>
      </header>

      <div className="ds-stack" role="group" aria-labelledby="queue-status-label">
        <p id="queue-status-label" className="ds-label">
          Pokaż rozwiązania
        </p>
        <div className="ds-cluster">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className="ds-chip"
              aria-pressed={status === t.value}
              onClick={() => update({ status: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="ds-stack" aria-labelledby="queue-results">
        <h2 id="queue-results">{tab.label}</h2>
        <LoadState loading={loading && !data} error={error} onRetry={reload} label="Wczytujemy rozwiązania…">
          {data && (
            <>
              <p aria-live="polite">
                {data.total} {plural(data.total, "rozwiązanie", "rozwiązania", "rozwiązań")}
              </p>
              {data.items.length === 0 ? (
                <EmptyState title={tab.empty}>
                  {status === "PENDING_REVIEW" && (
                    <p>Nowe pomysły pojawią się tutaj, gdy ktoś wyśle formularz „Mam pomysł”.</p>
                  )}
                </EmptyState>
              ) : (
                <ul className="ds-grid card-list">
                  {data.items.map((card) => (
                    <li key={card.id} className="ds-stack">
                      <SolutionCard card={card} headingLevel={3} />
                      <p>
                        <Link className="ds-btn" to={`/panel/rozwiazania/${card.id}`}>
                          Przejrzyj<span className="ds-sr-only">: {card.title}</span>
                        </Link>
                      </p>
                    </li>
                  ))}
                </ul>
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
