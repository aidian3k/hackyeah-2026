import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { commApi } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { MessageForm } from "@/components/comm/MessageForm";
import { OfferCard } from "@/components/comm/OfferCard";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { toApiError, useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginHref, useAuth } from "@/lib/auth";
import { INTENT_LABELS, rememberThread, SECTOR_LABELS } from "@/lib/comm";
import { formatDate } from "@/lib/format";
import { getSessionId } from "@/lib/storage";

const RELATED_SOLUTIONS = 3;

/** Moduł 5: ogłoszenie partnerstwa, pasujące ogłoszenia, powiązane rozwiązania i propozycja współpracy. */
export function OfferPage() {
  const id = Number(useParams().id);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const offer = useApi(() => commApi.getOffer(id), [id]);
  const matches = useApi(() => commApi.offerMatches(id), [id]);
  const category = offer.data?.category ?? null;
  const solutions = useApi(
    () => (category ? api.solutions({ category, limit: RELATED_SOLUTIONS }) : Promise.resolve(null)),
    [category],
  );
  const [closeError, setCloseError] = useState<string | null>(null);
  useDocumentTitle(offer.data?.title ?? "Ogłoszenie");

  async function propose(body: string) {
    const thread = await commApi.createThread({
      kind: "PARTNERSHIP",
      partnership_id: id,
      body,
      subject: `Partnerstwo: ${offer.data?.title ?? ""}`.slice(0, 200),
      session_id: getSessionId(),
    });
    rememberThread({ thread_id: thread.id, created_at: thread.created_at, excerpt: thread.subject });
    navigate(`/rozmowy/${thread.id}`);
  }

  async function toggleStatus() {
    if (!offer.data) return;
    setCloseError(null);
    try {
      await commApi.patchOffer(id, offer.data.status === "PUBLISHED" ? "CLOSED" : "PUBLISHED");
      offer.reload();
    } catch (err) {
      setCloseError(toApiError(err).message);
    }
  }

  const o = offer.data;
  return (
    <div className="ds-page max-w-3xl">
      <p className="m-0">
        <Link to="/partnerzy">Tablica partnerstw</Link> › Ogłoszenie
      </p>
      <LoadState loading={offer.loading} error={offer.error} onRetry={offer.reload}>
        {o && (
          <>
            <header className="flex flex-col gap-3">
              <ModuleLabel module="komunikacja" />
              <p className="m-0 flex flex-wrap gap-2">
                <span className="ds-tag">{INTENT_LABELS[o.intent]}</span>
                {o.status === "CLOSED" && <span className="ds-tag">Zamknięte</span>}
              </p>
              <h1 tabIndex={-1} className="m-0 [overflow-wrap:anywhere]">
                {o.title}
              </h1>
              <p className="m-0 text-small text-ink-muted">
                {o.organization} · {SECTOR_LABELS[o.sector]}
                {o.category_label_pl && ` · ${o.category_label_pl}`} · dodano {formatDate(o.created_at)}
              </p>
            </header>
            <p className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">{o.description}</p>

            {session?.role === "administrator" && (
              <div className="flex flex-col gap-2">
                <p className="m-0">
                  <button type="button" className="ds-btn" onClick={() => void toggleStatus()}>
                    {o.status === "PUBLISHED" ? "Zamknij ogłoszenie" : "Opublikuj ponownie"}
                  </button>
                </p>
                {closeError && <Alert tone="danger">{closeError}</Alert>}
              </div>
            )}

            <section aria-labelledby="pasujace" className="flex flex-col gap-3">
              <h2 id="pasujace" className="m-0">
                Pasujące ogłoszenia
              </h2>
              <LoadState loading={matches.loading} error={matches.error} onRetry={matches.reload}>
                {matches.data &&
                  (matches.data.length === 0 ? (
                    <p className="m-0">
                      {o.category
                        ? "Nie ma jeszcze ogłoszeń, które uzupełniają to ogłoszenie."
                        : "Ogłoszenie nie ma wybranego wyzwania, więc nie dopasowujemy innych ogłoszeń."}
                    </p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {matches.data.map((m) => (
                        <li key={m.id}>
                          <OfferCard offer={m} note={m.sector !== o.sector ? "Inny sektor" : undefined} />
                        </li>
                      ))}
                    </ul>
                  ))}
              </LoadState>
            </section>

            {category && (
              <section aria-labelledby="rozwiazania" className="flex flex-col gap-3">
                <h2 id="rozwiazania" className="m-0">
                  Powiązane rozwiązania z Biblioteki Innowacji
                </h2>
                <LoadState loading={solutions.loading} error={solutions.error} onRetry={solutions.reload}>
                  {solutions.data && solutions.data.items.length > 0 ? (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {solutions.data.items.map((s) => (
                        <li key={s.id}>
                          <SolutionCard card={s} headingLevel={3} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0">Brak rozwiązań w tym obszarze.</p>
                  )}
                </LoadState>
              </section>
            )}

            {o.status === "PUBLISHED" && session?.role !== "administrator" && (
              <section aria-labelledby="wspolpraca" className="flex flex-col gap-3">
                <h2 id="wspolpraca" className="m-0">
                  Zaproponuj współpracę
                </h2>
                <p className="m-0">Hub skontaktuje obie strony w tej rozmowie.</p>
                {session?.role === "reporter" ? (
                  <MessageForm label="Co możecie zaproponować?" submitLabel="Wyślij propozycję" onSend={propose} />
                ) : (
                  <p className="m-0">
                    <Link className="ds-btn ds-btn--primary" to={loginHref(pathname + search)}>
                      Zaloguj się, aby zaproponować współpracę
                    </Link>
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </LoadState>
    </div>
  );
}
