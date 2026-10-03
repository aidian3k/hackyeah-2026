import { useState } from "react";
import { Link } from "react-router-dom";
import type { ReportListItem, SolutionCard } from "@/api/types";
import { Alert } from "@/components/Alert";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { refreshInbox, useInbox } from "@/hooks/useInboxCount";
import { formatDateTime, formatRelative, plural } from "@/lib/format";
import { REPORTER_TYPE_LABELS } from "@/lib/labels";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import "@/styles/panel.css";

const REPORT_EXCERPT_CHARS = 200;
const SUMMARY_EXCERPT_CHARS = 160;

function excerpt(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

const timeFmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Status dopasowania: ikona + słowo (kolor nie jest jedyną informacją). */
function MatchStatus({ matched }: { matched: boolean }) {
  return (
    <span className={`match-status ${matched ? "match-status--matched" : "match-status--unmatched"}`}>
      <svg className="match-status__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {matched ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="7" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
      </svg>
      {matched ? "Dopasowano" : "Bez dopasowania"}
    </span>
  );
}

function ReportItem({ report }: { report: ReportListItem }) {
  const place = report.gmina ? (report.powiat ? `${report.gmina} (powiat ${report.powiat})` : report.gmina) : null;
  return (
    <li>
      <blockquote className="ds-quote inbox-report">
        <p>{excerpt(report.raw_text, REPORT_EXCERPT_CHARS)}</p>
        <footer className="ds-quote__footer inbox-report__meta">
          <span className="ds-cluster">
            <MatchStatus matched={report.matched} />
            <CategoryTag code={report.category} label={report.category_label_pl} />
          </span>
          <span className="inbox-report__facts">
            <span>Zgłoszenie nr {report.id}</span>
            {place && <span>{place}</span>}
            <span>{REPORTER_TYPE_LABELS[report.reporter_type]}</span>
            <time dateTime={report.created_at} title={formatDateTime(report.created_at)}>
              {formatRelative(report.created_at)}
            </time>
          </span>
          <Link to={`/panel/zgloszenia/${report.id}`} className="inbox-report__link">
            Otwórz zgłoszenie<span className="ds-sr-only"> nr {report.id}</span>
          </Link>
        </footer>
      </blockquote>
    </li>
  );
}

function PendingItem({ card }: { card: SolutionCard }) {
  const by = [card.organization, card.gmina].filter(Boolean).join(" · ");
  return (
    <li>
      <article className="ds-card ds-stack inbox-pending">
        <CategoryTag code={card.category} label={card.category_label_pl} />
        <h3 className="inbox-pending__title">
          <Link to={`/panel/rozwiazania/${card.id}`}>{card.title}</Link>
        </h3>
        {by && <p className="inbox-pending__by">{by}</p>}
        <p>{excerpt(card.summary, SUMMARY_EXCERPT_CHARS)}</p>
      </article>
    </li>
  );
}

// F14: pierwszy ekran pracownika Hubu. Zamiast webhooka (ADR-018) panel odpytuje /api/inbox co 30 s.
export function InboxPage() {
  useDocumentTitle("Panel: Nowe");
  const { data, error, loading, announcement } = useInbox();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState("");

  function refreshNow() {
    setRefreshing(true);
    void refreshInbox(0).then(() => {
      setRefreshing(false);
      setRefreshNote(`Odświeżono o ${timeFmt.format(new Date())}.`);
    });
  }

  const unmatched = data?.latest_reports.filter((r) => !r.matched) ?? [];
  const matched = data?.latest_reports.filter((r) => r.matched) ?? [];

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Nowe</h1>
        <p>
          Co nowego wpłynęło do Hubu. Lista odświeża się sama co 30 sekund. Pozycja znika, gdy zmienisz status
          zgłoszenia albo zatwierdzisz lub odrzucisz pomysł.
        </p>
        <div className="ds-cluster">
          <button type="button" className="ds-btn ds-btn--small" onClick={refreshNow} disabled={refreshing}>
            {refreshing ? "Odświeżamy…" : "Odśwież teraz"}
          </button>
        </div>
      </div>

      <p className="ds-sr-only" aria-live="polite">
        {refreshNote} {announcement}
      </p>

      {/* Bez danych: spinner albo błąd z „Spróbuj ponownie”. Z danymi: błąd odświeżenia nad nieaktualną listą. */}
      {!data ? (
        <LoadState loading={loading} error={error} onRetry={refreshNow} label="Wczytujemy skrzynkę…" />
      ) : (
        <>
          {error && (
            <div role="alert">
              <Alert tone="danger" title="Nie udało się odświeżyć skrzynki.">
                {`${error.message} Poniżej są dane z poprzedniego odświeżenia.`}
              </Alert>
            </div>
          )}

          <section aria-labelledby="inbox-counts" className="ds-stack">
            <h2 id="inbox-counts" className="ds-sr-only">
              Podsumowanie skrzynki
            </h2>
            <ul className="ds-grid card-list inbox-tiles">
              <li>
                <div className="ds-card ds-stack inbox-tile">
                  <p className="inbox-tile__value">{data.new_reports}</p>
                  <p className="inbox-tile__label">
                    {plural(data.new_reports, "Nowe zgłoszenie", "Nowe zgłoszenia", "Nowych zgłoszeń")}
                  </p>
                </div>
              </li>
              <li>
                <div className="ds-card ds-stack inbox-tile">
                  <p className="inbox-tile__value">{data.new_unmatched}</p>
                  <p className="inbox-tile__label">W tym bez dopasowania</p>
                  {data.new_unmatched > 0 && (
                    <Alert tone="warning">
                      Te zgłoszenia pokazują luki w bazie rozwiązań. Przejrzyj je najpierw.
                    </Alert>
                  )}
                  <Link to="/panel/zgloszenia?matched=false&status=NEW">Zobacz zgłoszenia bez dopasowania</Link>
                </div>
              </li>
              <li>
                <div className="ds-card ds-stack inbox-tile">
                  <p className="inbox-tile__value">{data.pending_solutions}</p>
                  <p className="inbox-tile__label">
                    {plural(
                      data.pending_solutions,
                      "Pomysł do zatwierdzenia",
                      "Pomysły do zatwierdzenia",
                      "Pomysłów do zatwierdzenia",
                    )}
                  </p>
                  <Link to="/panel/rozwiazania">Przejrzyj pomysły</Link>
                </div>
              </li>
            </ul>
          </section>

          <section aria-labelledby="inbox-reports" className="ds-stack">
            <h2 id="inbox-reports">Najnowsze zgłoszenia</h2>
            {data.latest_reports.length === 0 ? (
              <EmptyState title="Nie ma nowych zgłoszeń.">
                <p>Nowe zgłoszenia z czatu pojawią się tu same.</p>
              </EmptyState>
            ) : (
              <>
                {unmatched.length > 0 && (
                  <div className="ds-stack">
                    <h3>Bez dopasowania ({unmatched.length})</h3>
                    <ul className="inbox-list">
                      {unmatched.map((r) => (
                        <ReportItem key={r.id} report={r} />
                      ))}
                    </ul>
                  </div>
                )}
                {matched.length > 0 && (
                  <div className="ds-stack">
                    <h3>Z dopasowaniem ({matched.length})</h3>
                    <ul className="inbox-list">
                      {matched.map((r) => (
                        <ReportItem key={r.id} report={r} />
                      ))}
                    </ul>
                  </div>
                )}
                {data.new_reports > data.latest_reports.length && (
                  <p>
                    Pokazujemy {data.latest_reports.length} najnowszych z {data.new_reports}.{" "}
                    <Link to="/panel/zgloszenia">Przejdź do listy zgłoszeń</Link>
                  </p>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="inbox-pending" className="ds-stack">
            <h2 id="inbox-pending">Pomysły czekające na przejrzenie</h2>
            {data.latest_pending.length === 0 ? (
              <EmptyState title="Nie ma pomysłów do zatwierdzenia.">
                <p>Pomysły wysłane przez formularz „Mam pomysł” pojawią się tu same.</p>
              </EmptyState>
            ) : (
              <ul className="ds-grid card-list">
                {data.latest_pending.map((c) => (
                  <PendingItem key={c.id} card={c} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
