import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { Reply, ReportDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { ReplyList } from "@/components/ReplyList";
import { SolutionCard } from "@/components/SolutionCard";
import { ReplyForm } from "@/components/panel/ReplyForm";
import { MatchLabel, SimilarReports } from "@/components/panel/SimilarReports";
import { StatusControl } from "@/components/panel/StatusControl";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime } from "@/lib/format";
import { REPORTER_TYPE_LABELS } from "@/lib/labels";
// Okruszki: klasy breadcrumbs z arkusza strony rozwiązania (F10) — DS nie ma ds-breadcrumbs.
import "@/styles/solution.css";

const scoreFmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function place(gmina: string | null, powiat: string | null): string {
  if (gmina && powiat) return `${gmina} (powiat ${powiat})`;
  if (gmina) return gmina;
  if (powiat) return `powiat ${powiat}`;
  return "Nie podano";
}

function Breadcrumbs({ id }: { id: number | null }) {
  return (
    <nav aria-label="Jesteś tutaj">
      <ol className="breadcrumbs__list">
        <li>
          <Link to="/panel/zgloszenia">Zgłoszenia</Link>
        </li>
        <li>
          <span aria-current="page">{id === null ? "Zgłoszenie" : `Zgłoszenie nr ${id}`}</span>
        </li>
      </ol>
    </nav>
  );
}

// F16: panel — szczegóły zgłoszenia, status, podobne zgłoszenia i odpowiedź do autora.
// Treść zgłoszenia nie trafia do URL ani do logów; linki niosą tylko numer zgłoszenia.
export function ReportPage() {
  const id = parseId(useParams().id);
  useDocumentTitle(id === null ? "Panel: Zgłoszenie" : `Panel: Zgłoszenie nr ${id}`);

  const loaded = useApi<ReportDetail>(
    () =>
      id === null
        ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono zgłoszenia."))
        : api.report(id),
    [id],
  );
  // Zgłoszenie po zmianie statusu lub odpowiedzi (bez ponownego spinnera całej strony).
  const [patched, setPatched] = useState<ReportDetail | null>(null);
  const report = patched?.id === id ? patched : loaded.data;

  async function refreshReport(): Promise<void> {
    if (id === null) return;
    const fresh = await api.report(id);
    setPatched(fresh);
  }

  const notFound = loaded.error?.status === 404;

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <Breadcrumbs id={id} />
        <h1 tabIndex={-1}>{id === null ? "Zgłoszenie" : `Zgłoszenie nr ${id}`}</h1>
      </div>

      {notFound ? (
        <div role="alert">
          <Alert tone="warning" title="Nie znaleźliśmy tego zgłoszenia.">
            <p>Sprawdź numer albo wróć do listy.</p>
            <p>
              <Link to="/panel/zgloszenia">Wróć do listy zgłoszeń</Link>
            </p>
          </Alert>
        </div>
      ) : (
        <LoadState
          loading={loaded.loading && !report}
          error={report ? null : loaded.error}
          onRetry={loaded.reload}
          label="Wczytujemy zgłoszenie…"
        >
          {report && <ReportView key={report.id} report={report} onPatched={setPatched} onRefresh={refreshReport} />}
        </LoadState>
      )}
    </div>
  );
}

interface ViewProps {
  report: ReportDetail;
  onPatched(r: ReportDetail): void;
  onRefresh(): Promise<void>;
}

function ReportView({ report, onPatched, onRefresh }: ViewProps) {
  const replies = useApi(() => api.replies(report.id), [report.id]);
  // Odpowiedzi wysłane z tej strony (dopisane bez ponownego wczytywania listy).
  const [sent, setSent] = useState<Reply[]>([]);
  const known = new Set((replies.data ?? []).map((r) => r.id));
  const allReplies = [...(replies.data ?? []), ...sent.filter((r) => !known.has(r.id))];

  function handleSent(reply: Reply) {
    setSent((list) => [...list, reply]);
    // Backend przestawia NEW/TRIAGED/MATCHED na IN_PROGRESS — pokaż aktualny status.
    void onRefresh().catch(() => undefined);
  }

  return (
    <>
      <section className="ds-stack" aria-labelledby="tresc-zgloszenia">
        <h2 id="tresc-zgloszenia">Treść zgłoszenia</h2>
        <blockquote className="ds-quote">
          <p>{report.raw_text}</p>
          <footer className="ds-quote__footer">
            Zgłoszenie nr {report.id}, <time dateTime={report.created_at}>{formatDateTime(report.created_at)}</time>
          </footer>
        </blockquote>

        <dl className="ds-meta">
          <div className="ds-meta__item">
            <dt>Wyzwanie</dt>
            <dd>
              {report.category ? (
                <CategoryTag code={report.category} label={report.category_label_pl ?? report.category} />
              ) : (
                "Nie rozpoznano"
              )}
            </dd>
          </div>
          <div className="ds-meta__item">
            <dt>Gmina</dt>
            <dd>{place(report.gmina, report.powiat)}</dd>
          </div>
          <div className="ds-meta__item">
            <dt>Zgłaszający</dt>
            <dd>{REPORTER_TYPE_LABELS[report.reporter_type]}</dd>
          </div>
          {report.severity_self !== null && (
            <div className="ds-meta__item">
              <dt>Pilność (ocena zgłaszającego)</dt>
              <dd>{report.severity_self} z 5</dd>
            </div>
          )}
          <div className="ds-meta__item">
            <dt>Dla kogo</dt>
            <dd>{report.target_group ?? "Nie rozpoznano"}</dd>
          </div>
          <div className="ds-meta__item">
            <dt>Data</dt>
            <dd>
              <time dateTime={report.created_at}>{formatDateTime(report.created_at)}</time>
            </dd>
          </div>
          <div className="ds-meta__item">
            <dt>Dopasowanie</dt>
            <dd className="ds-cluster">
              <MatchLabel matched={report.matched} />
              {report.top_rerank_score !== null && <span>wynik {scoreFmt.format(report.top_rerank_score)}</span>}
            </dd>
          </div>
        </dl>

        <details>
          <summary>Dane techniczne</summary>
          <div className="ds-stack">
            <h3>Tekst po normalizacji</h3>
            <p>{report.normalized_text}</p>
            <h3>Dane wyodrębnione automatycznie (JSON)</h3>
            {/* Zawijanie zamiast poziomego przewijania przy 320 px. */}
            <pre className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              {JSON.stringify(report.extracted, null, 2)}
            </pre>
          </div>
        </details>
      </section>

      <TopMatch solutionId={report.top_solution_id} />

      <StatusControl report={report} onChange={onPatched} onRefresh={onRefresh} />

      <SimilarReports reportId={report.id} />

      <section className="ds-stack" aria-labelledby="odpowiedzi-do-autora">
        <h2 id="odpowiedzi-do-autora">Odpowiedzi do autora</h2>
        <p>Autor zgłoszenia przeczyta je w zakładce Moje zgłoszenia, po numerze zgłoszenia.</p>
        <LoadState
          loading={replies.loading && !replies.data}
          error={replies.error}
          onRetry={replies.reload}
          label="Wczytujemy odpowiedzi…"
        >
          {allReplies.length === 0 ? (
            <EmptyState title="Nikt jeszcze nie odpowiedział." />
          ) : (
            <ReplyList replies={allReplies} headingLevel={3} />
          )}
        </LoadState>
        <ReplyForm reportId={report.id} onSent={handleSent} />
      </section>
    </>
  );
}

/** Najlepsze rozwiązanie z wyszukiwania albo informacja o luce w bibliotece. */
function TopMatch({ solutionId }: { solutionId: number | null }) {
  return (
    <section className="ds-stack" aria-labelledby="najlepsze-dopasowanie">
      <h2 id="najlepsze-dopasowanie">Najlepsze dopasowanie</h2>
      {solutionId === null ? (
        <Alert tone="warning">
          <p>Brak dopasowanego rozwiązania. To może być luka w bibliotece.</p>
        </Alert>
      ) : (
        <TopMatchCard solutionId={solutionId} />
      )}
    </section>
  );
}

function TopMatchCard({ solutionId }: { solutionId: number }) {
  const { data, error, loading, reload } = useApi(() => api.solution(solutionId), [solutionId]);
  return (
    <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy rozwiązanie…">
      {data && (
        <ul className="ds-grid card-list">
          <li>
            <SolutionCard card={data} headingLevel={3} />
          </li>
        </ul>
      )}
    </LoadState>
  );
}
