import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { ReplyList } from "@/components/ReplyList";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime, plural } from "@/lib/format";
import {
  EXCERPT_CHARS,
  listMyReports,
  removeMyReport,
  type MyReport,
} from "@/lib/storage";
import "@/styles/my-reports.css";

/** Czy przeglądarka pozwala zapisać coś w localStorage (tryb prywatny, zablokowane dane → false). */
function storageAvailable(): boolean {
  try {
    const key = "splot_probe";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// F12: autor czyta odpowiedzi Hubu po samym report_id (bez autoryzacji).
// Treści zgłoszenia z serwera tu nie pokazujemy — tylko skrót zapisany w tej przeglądarce.
export function MyReportsPage() {
  useDocumentTitle("Moje zgłoszenia");
  // Odczyt raz przy wejściu na stronę; odpowiedzi odpytujemy przy każdym wejściu.
  const [reports, setReports] = useState<MyReport[]>(() => listMyReports());
  const [canStore] = useState(storageAvailable);
  const [status, setStatus] = useState("");

  function forget(id: number) {
    removeMyReport(id);
    setReports((list) => list.filter((r) => r.report_id !== id));
    setStatus(`Usunięto zgłoszenie nr ${id} z listy na tym urządzeniu.`);
    // Karta znika — fokus wraca na nagłówek strony, żeby nie zgubić miejsca.
    document.querySelector<HTMLElement>("main h1")?.focus();
  }

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <h1 tabIndex={-1}>Moje zgłoszenia</h1>
        <p>
          Tu zobaczysz odpowiedzi zespołu Hubu na Twoje zgłoszenia z tego
          urządzenia.
        </p>
      </div>

      <p className="ds-sr-only" aria-live="polite">
        {status}
      </p>

      {!canStore && (
        <Alert tone="info">
          Twoja przeglądarka nie pozwala zapamiętać zgłoszeń. Zapisz numer
          zgłoszenia.
        </Alert>
      )}

      {reports.length === 0 ? (
        <EmptyState title="Nie masz jeszcze zgłoszeń na tym urządzeniu.">
          <p>
            Opisz problem w module <Link to="/">Matchmaking społeczny</Link>.
            Zgłoszenie pojawi się tutaj, a z nim odpowiedzi zespołu Hubu.
          </p>
        </EmptyState>
      ) : (
        <section className="ds-stack" aria-label="Lista zgłoszeń">
          <p>
            Masz {reports.length}{" "}
            {plural(reports.length, "zgłoszenie", "zgłoszenia", "zgłoszeń")}{" "}
            zapisane w tej przeglądarce.
          </p>
          <ol className="my-reports">
            {reports.map((r) => (
              <li key={r.report_id}>
                <MyReportCard report={r} onForget={forget} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function MyReportCard({
  report,
  onForget,
}: {
  report: MyReport;
  onForget(id: number): void;
}) {
  const id = report.report_id;
  const { data, error, loading, reload } = useApi(() => api.replies(id), [id]);
  const titleId = `my-report-${id}-title`;
  // Skrót ma najwyżej 80 znaków; „…” tylko, gdy wiadomość mogła być dłuższa.
  const excerpt =
    report.excerpt.length >= EXCERPT_CHARS
      ? `${report.excerpt}…`
      : report.excerpt;
  const count = data?.length ?? null;
  // 404: zgłoszenia nie ma już na serwerze (np. dane testowe wyczyszczone) — nie ma czego ponawiać.
  const gone = error?.status === 404;

  return (
    <article className="ds-card ds-stack my-report" aria-labelledby={titleId}>
      <div className="my-report__head">
        <h2 id={titleId} className="my-report__title">
          Zgłoszenie nr {id}
        </h2>
        {count !== null && (
          <p className="my-report__count">
            {count === 0
              ? "Brak odpowiedzi"
              : `${count} ${plural(count, "odpowiedź", "odpowiedzi", "odpowiedzi")}`}
          </p>
        )}
      </div>

      <dl className="ds-meta ds-meta--small">
        <div className="ds-meta__item">
          <dt>Wysłano</dt>
          <dd>
            <time dateTime={report.created_at}>
              {formatDateTime(report.created_at)}
            </time>
          </dd>
        </div>
        {report.gmina && (
          <div className="ds-meta__item">
            <dt>Gmina</dt>
            <dd>{report.gmina}</dd>
          </div>
        )}
      </dl>

      {excerpt && (
        <p className="my-report__excerpt">
          <span className="ds-sr-only">Początek zgłoszenia: </span>„{excerpt}”
        </p>
      )}

      <section
        className="ds-stack my-report__replies"
        aria-label={`Odpowiedzi na zgłoszenie nr ${id}`}
      >
        {gone ? (
          <Alert tone="warning">
            <p>
              Nie znaleźliśmy tego zgłoszenia na serwerze. Mogło zostać usunięte
              razem z danymi testowymi.
            </p>
            <p>
              <button
                type="button"
                className="ds-btn ds-btn--small"
                onClick={() => onForget(id)}
              >
                Usuń zgłoszenie nr {id} z listy
              </button>
            </p>
          </Alert>
        ) : (
          <LoadState
            loading={loading}
            error={error}
            onRetry={reload}
            label="Wczytujemy odpowiedzi…"
          >
            {data &&
              (data.length === 0 ? (
                <p className="my-report__none">
                  Zespół Hubu jeszcze nie odpowiedział. Zajrzyj tu za kilka dni.
                </p>
              ) : (
                <ReplyList replies={data} headingLevel={3} />
              ))}
          </LoadState>
        )}
      </section>
    </article>
  );
}
