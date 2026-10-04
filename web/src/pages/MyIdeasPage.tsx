import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "@/api/client";
import type { IdeaDetail, IdeaReply, Reply } from "@/api/types";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { ReplyList } from "@/components/ReplyList";
import { IdeaStatusLabel } from "@/components/idea/IdeaStatusCard";
import { KreatorNav, NewReplyBadge } from "@/components/layout/KreatorNav";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime, plural } from "@/lib/format";
import { IDEA_STAGE_LABELS } from "@/lib/labels";
import { forgetIdea, listMyIdeas, markRepliesSeen, type MyIdea } from "@/lib/storage";

/** ReplyList (M1) przyjmuje kształt odpowiedzi do zgłoszenia; korzysta tylko z id, daty, podpisu i treści. */
function asReplies(replies: IdeaReply[]): Reply[] {
  return replies.map((r) => ({ ...r, report_id: r.idea_id }));
}

/** Pasek postępu kanwy: liczba w tekście, pasek `ds-bar` tylko jako dekoracja. */
function CanvasPercent({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <span className="flex flex-col gap-1">
      <span>Wypełniono {p}% mapy</span>
      <span className="ds-bar--navy" aria-hidden="true">
        <span className="ds-bar__track">
          <span className="ds-bar__fill" style={{ "--ds-bar-share": `${p}%` } as CSSProperties} />
        </span>
      </span>
    </span>
  );
}

// K11: autor czyta odpowiedzi Hubu po samym id pomysłu (bez autoryzacji, jak „Moje zgłoszenia”).
export function MyIdeasPage() {
  useDocumentTitle("Moje pomysły");
  // Odczyt raz przy wejściu: `seen_replies` z chwili wejścia wyznacza, które odpowiedzi są nowe,
  // także po tym, jak karta oznaczy je jako przeczytane.
  const [ideas, setIdeas] = useState<MyIdea[]>(() => listMyIdeas());
  const [status, setStatus] = useState("");
  // Przycisk „Przygotuj wniosek” tylko wtedy, gdy jest otwarty nabór (błąd = bez przycisku).
  const calls = useApi(() => api.calls(), []);
  const hasOpenCall = calls.data?.some((c) => c.is_open) ?? false;

  function forget(id: number) {
    forgetIdea(id);
    setIdeas((list) => list.filter((x) => x.idea_id !== id));
    setStatus(`Usunięto pomysł nr ${id} z listy na tym urządzeniu.`);
    document.querySelector<HTMLElement>("main h1")?.focus();
  }

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Moje pomysły
          </h1>
          <p className="m-0 text-body-lg text-ink">
            Tu zobaczysz pomysły zapisane na tym urządzeniu i odpowiedzi zespołu Hubu.
          </p>
        </div>
        <KreatorNav />
      </header>

      <p className="ds-sr-only" aria-live="polite">
        {status}
      </p>

      {ideas.length === 0 ? (
        <EmptyState title="Nie masz jeszcze pomysłów na tym urządzeniu.">
          <p>
            Opisz swój pomysł w zakładce <Link to="/mam-pomysl">Nowy pomysł</Link>. Pojawi się tutaj razem z
            odpowiedziami zespołu Hubu.
          </p>
        </EmptyState>
      ) : (
        <section className="flex flex-col gap-4" aria-label="Lista pomysłów">
          <p className="m-0 text-body text-ink">
            Masz {ideas.length} {plural(ideas.length, "pomysł", "pomysły", "pomysłów")} zapisane w tej przeglądarce.
          </p>
          <ol className="m-0 flex list-none flex-col gap-6 p-0">
            {ideas.map((x) => (
              <li key={x.idea_id}>
                <MyIdeaCard entry={x} hasOpenCall={hasOpenCall} onForget={forget} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function MyIdeaCard({
  entry,
  hasOpenCall,
  onForget,
}: {
  entry: MyIdea;
  hasOpenCall: boolean;
  onForget(id: number): void;
}) {
  const id = entry.idea_id;
  const { hash } = useLocation();
  const { data, error, loading, reload } = useApi(
    () => Promise.all([api.idea(id), api.ideaReplies(id)]),
    [id],
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = `pomysl-${id}-tytul`;
  const gone = error?.status === 404;
  const idea: IdeaDetail | null = data?.[0] ?? null;
  const replies = data?.[1] ?? [];
  // Ile odpowiedzi autor widział przed wejściem na stronę (wpis z chwili odczytu listy).
  const seen = Math.min(entry.seen_replies, replies.length);
  const fresh = replies.slice(seen);
  const older = replies.slice(0, seen);

  // Po wyświetleniu odpowiedzi oznaczamy je jako przeczytane (znika znacznik w nawigacji).
  useEffect(() => {
    if (data) markRepliesSeen(id, data[1].length);
  }, [data, id]);

  // Kotwica #pomysl-<id> (np. link „Odpowiedzi Hubu” z fiszki): karta wczytuje się asynchronicznie,
  // więc przewijamy i ustawiamy fokus dopiero po załadowaniu.
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || hash !== `#pomysl-${id}` || loading) return;
    scrolled.current = true;
    headingRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [hash, id, loading]);

  const title = idea?.title ?? entry.title_excerpt;

  return (
    <article
      id={`pomysl-${id}`}
      className="ds-card flex scroll-mt-4 flex-col gap-4"
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-sans text-h3 text-navy [overflow-wrap:anywhere]"
        >
          {title || `Pomysł nr ${id}`}
        </h2>
        {fresh.length > 0 && (
          <p className="m-0 font-sans text-label text-navy">
            <NewReplyBadge count={fresh.length} />
          </p>
        )}
      </div>

      {gone ? (
        <Alert tone="warning">
          <p>Nie znaleźliśmy tego pomysłu na serwerze. Mógł zostać usunięty razem z danymi testowymi.</p>
          <p>
            <button type="button" className="ds-btn ds-btn--small" onClick={() => onForget(id)}>
              Usuń pomysł nr {id} z listy
            </button>
          </p>
        </Alert>
      ) : (
        <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy pomysł…">
          {idea && (
            <>
              <dl className="ds-meta ds-meta--small m-0">
                <div className="ds-meta__item">
                  <dt>Status</dt>
                  <dd>
                    <IdeaStatusLabel status={idea.status} />
                  </dd>
                </div>
                <div className="ds-meta__item">
                  <dt>Etap</dt>
                  <dd>{IDEA_STAGE_LABELS[idea.stage]}</dd>
                </div>
                <div className="ds-meta__item">
                  <dt>Social Canvas</dt>
                  <dd>
                    <CanvasPercent percent={idea.canvas_percent} />
                  </dd>
                </div>
                <div className="ds-meta__item">
                  <dt>{idea.submitted_at ? "Wysłano do Hubu" : "Zapisano"}</dt>
                  <dd>
                    <time dateTime={idea.submitted_at ?? idea.created_at}>
                      {formatDateTime(idea.submitted_at ?? idea.created_at)}
                    </time>
                  </dd>
                </div>
              </dl>

              {idea.status === "DRAFT" && (
                <p className="m-0 text-body text-ink">
                  To szkic. Zespół Hubu zobaczy pomysł, gdy wyślesz go z fiszki albo z kanwy.
                </p>
              )}

              <ul className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label={`Działania: ${idea.title}`}>
                <li>
                  <Link className="ds-btn ds-btn--small" to={`/mam-pomysl/${id}`}>
                    Edytuj fiszkę<span className="ds-sr-only">: {idea.title}</span>
                  </Link>
                </li>
                <li>
                  <Link className="ds-btn ds-btn--small" to={`/mam-pomysl/${id}/kanwa`}>
                    Kanwa<span className="ds-sr-only"> Social Canvas: {idea.title}</span>
                  </Link>
                </li>
                {hasOpenCall && (
                  <li>
                    <Link className="ds-btn ds-btn--small" to="/nabory">
                      Przygotuj wniosek<span className="ds-sr-only">: {idea.title}</span>
                    </Link>
                  </li>
                )}
                {idea.applications.map((app) => (
                  <li key={app.id}>
                    <Link className="ds-btn ds-btn--small" to={`/wnioski/${app.id}`}>
                      Wniosek do naboru {app.call_id}
                    </Link>
                  </li>
                ))}
              </ul>

              <section className="flex flex-col gap-3" aria-label={`Odpowiedzi Hubu: ${idea.title}`}>
                <p className="m-0 font-sans text-label text-ink">
                  {replies.length === 0
                    ? "Odpowiedzi zespołu Hubu"
                    : `Odpowiedzi zespołu Hubu: ${replies.length}`}
                </p>
                {replies.length === 0 ? (
                  <p className="m-0 text-body text-ink">
                    {idea.status === "DRAFT"
                      ? "Odpowiedzi pojawią się tutaj po wysłaniu pomysłu do Hubu."
                      : "Zespół Hubu jeszcze nie odpowiedział. Zajrzyj tu za kilka dni."}
                  </p>
                ) : (
                  <>
                    <ReplyList replies={asReplies(older)} headingLevel={3} />
                    {fresh.length > 0 && (
                      <div className="flex flex-col gap-2 rounded-lg border-2 border-solid border-navy p-3">
                        <p className="m-0 font-sans text-label text-navy">
                          <NewReplyBadge count={fresh.length} />
                        </p>
                        <ReplyList replies={asReplies(fresh)} headingLevel={3} />
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </LoadState>
      )}
    </article>
  );
}
