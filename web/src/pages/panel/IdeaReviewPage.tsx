import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { CanvasDefinition, CanvasState, IdeaDetail, IdeaHubStatus, IdeaReply, Reply } from "@/api/types";
import { Alert } from "@/components/Alert";
import { CategoryTag } from "@/components/CategoryTag";
import { LoadState } from "@/components/LoadState";
import { ReplyList } from "@/components/ReplyList";
import { SimilarInnovations } from "@/components/assistant/SimilarInnovations";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { CanvasProgressBar } from "@/components/canvas/CanvasProgressBar";
import { IdeaStatusLabel } from "@/components/idea/IdeaStatusCard";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError, useApi } from "@/hooks/useApi";
import { loadCanvasDefinition } from "@/hooks/useCanvas";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime, plural } from "@/lib/format";
import { IDEA_STAGE_LABELS, IDEA_STATUS_LABELS } from "@/lib/labels";
import { NewIdeaMarker } from "@/pages/panel/IdeasPage";

/** Statusy, które ustawia Hub (POST /api/ideas/{id}/status), w kolejności pracy z pomysłem. */
const HUB_STATUSES: IdeaHubStatus[] = ["SUBMITTED", "IN_REVIEW", "INVITED", "REJECTED"];

/** Limity backendu (ReplyCreate): body 1..4000, author_label ..100 znaków. */
const BODY_MAX = 4000;
const LABEL_MAX = 100;
/** Licznik wyróżniony od 90% limitu. */
const COUNTER_WARN = 0.9;
/** Podpis odpowiedzi proponowany w formularzu (autor może go zmienić albo usunąć). */
const DEFAULT_REPLY_LABEL = "Zespół Hubu";

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** `?arkusz=1|2|3` → indeks arkusza (0–2); wartość spoza zakresu = pierwszy arkusz. */
function parseSheet(raw: string | null, count: number): number {
  const n = raw && /^\d+$/.test(raw) ? Number(raw) : 1;
  return n >= 1 && n <= count ? n - 1 : 0;
}

/** Długość w znakach jak w backendzie (punkty kodowe, nie jednostki UTF-16). */
function charCount(text: string): number {
  return [...text].length;
}

/** ReplyList (M1) przyjmuje kształt odpowiedzi do zgłoszenia; korzysta tylko z id, daty, podpisu i treści. */
function asReplies(replies: IdeaReply[]): Reply[] {
  return replies.map((r) => ({ ...r, report_id: r.idea_id }));
}

function Breadcrumbs({ id }: { id: number | null }) {
  return (
    <nav aria-label="Jesteś tutaj">
      <ol className="m-0 flex list-none flex-wrap gap-x-2 p-0 text-small text-ink">
        <li className="flex gap-2">
          <Link to="/panel/pomysly">Pomysły</Link>
          <span aria-hidden="true">/</span>
        </li>
        <li>
          <span aria-current="page">{id === null ? "Pomysł" : `Pomysł nr ${id}`}</span>
        </li>
      </ol>
    </nav>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-label text-ink">{term}</dt>
      <dd className="m-0 whitespace-pre-line text-body text-ink [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Fiszka pomysłu. Adresu e-mail autora API nie zwraca — pokazujemy tylko, czy go zostawił. */
function IdeaCardSection({ idea }: { idea: IdeaDetail }) {
  return (
    <section aria-labelledby="idea-card" className="ds-card flex min-w-0 flex-col gap-4">
      <h2 id="idea-card" className="m-0 font-sans text-h2 text-navy">
        Fiszka pomysłu
      </h2>
      <dl className="m-0 flex flex-col gap-3">
        <Fact term="Krótki opis">{idea.summary}</Fact>
        <Fact term="Na czym polega istota pomysłu?">{idea.essence || "Autor nie uzupełnił."}</Fact>
        <Fact term="Dla kogo jest pomysł?">{idea.audience || "Autor nie uzupełnił."}</Fact>
        <Fact term="Etap">{IDEA_STAGE_LABELS[idea.stage]}</Fact>
        <Fact term="Wyzwanie">
          {idea.category && idea.category_label_pl ? (
            <CategoryTag code={idea.category} label={idea.category_label_pl} />
          ) : (
            "Nie przypisano"
          )}
        </Fact>
        <Fact term="Gmina">
          {idea.gmina ? (idea.powiat ? `${idea.gmina} (powiat ${idea.powiat})` : idea.gmina) : "Nie podano"}
        </Fact>
        <Fact term="Autor">{idea.author_name || "Nie podpisano"}</Fact>
        <Fact term="Kontakt">{idea.has_contact ? "Autor zostawił e-mail" : "Autor nie zostawił e-maila"}</Fact>
        <Fact term={idea.submitted_at ? "Wysłano do Hubu" : "Utworzono"}>
          <time dateTime={idea.submitted_at ?? idea.created_at}>
            {formatDateTime(idea.submitted_at ?? idea.created_at)}
          </time>
        </Fact>
        {idea.source_report_id !== null && (
          <Fact term="Zgłoszenie źródłowe">
            <Link to={`/panel/zgloszenia/${idea.source_report_id}`}>Zgłoszenie nr {idea.source_report_id}</Link>
          </Fact>
        )}
        {idea.applications.length > 0 && (
          <Fact term="Wnioski grantowe">
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {idea.applications.map((app) => (
                <li key={app.id}>
                  <Link to={`/wnioski/${app.id}`}>Wniosek do naboru {app.call_id}</Link>
                </li>
              ))}
            </ul>
          </Fact>
        )}
      </dl>
    </section>
  );
}

/** Status pomysłu jako select z zapisem. Hub ustawia dowolny status (bez macierzy przejść). */
function IdeaStatusControl({ idea, onChange }: { idea: IdeaDetail; onChange(updated: IdeaDetail): void }) {
  const selectId = useId();
  const [value, setValue] = useState<IdeaHubStatus | "">(idea.status === "DRAFT" ? "" : idea.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [lastStatus, setLastStatus] = useState(idea.status);
  // Status zmieniony z zewnątrz (np. odpowiedź przeniosła pomysł do „W analizie”) — select za nim podąża.
  if (idea.status !== lastStatus) {
    setLastStatus(idea.status);
    setValue(idea.status === "DRAFT" ? "" : idea.status);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const updated = await api.setIdeaStatus(idea.id, value);
      onChange(updated);
      setMessage(`Zapisano status „${IDEA_STATUS_LABELS[updated.status]}”.`);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="idea-status" className="ds-card flex flex-col gap-3">
      <h2 id="idea-status" className="m-0 font-sans text-h2 text-navy">
        Status
      </h2>
      <p className="m-0 flex flex-wrap items-center gap-2 text-body text-ink">
        <span>Obecny status:</span>
        <strong>
          <IdeaStatusLabel status={idea.status} />
        </strong>
      </p>
      {idea.status === "DRAFT" && (
        <p className="m-0 text-body text-ink">Autor jeszcze nie wysłał tego pomysłu do Hubu.</p>
      )}
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void save(e)}>
        <div className="ds-field">
          <label className="ds-label" htmlFor={selectId}>
            Zmień status
          </label>
          <select
            id={selectId}
            className="ds-select"
            value={value}
            onChange={(e) => setValue(e.target.value as IdeaHubStatus)}
          >
            {value === "" && (
              <option value="" disabled>
                Wybierz status
              </option>
            )}
            {HUB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {IDEA_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button type="submit" className="ds-btn" disabled={busy || !value || value === idea.status}>
            {busy ? "Zapisujemy…" : "Zapisz status"}
          </button>
        </div>
      </form>
      <div aria-live="polite">{message && <Alert tone="success">{message}</Alert>}</div>
      {error && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się zmienić statusu.">
            {error.message}
          </Alert>
        </div>
      )}
    </section>
  );
}

/** Odpowiedź Hubu do autora pomysłu (wzór ReplyForm z F16). Autor widzi ją w „Moich pomysłach”. */
function IdeaReplyForm({ ideaId, onSent }: { ideaId: number; onSent(): void }) {
  const uid = useId();
  const ids = {
    body: `${uid}-body`,
    bodyCounter: `${uid}-body-counter`,
    bodyError: `${uid}-body-error`,
    label: `${uid}-label`,
    labelHint: `${uid}-label-hint`,
    labelError: `${uid}-label-error`,
  };
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [label, setLabel] = useState(DEFAULT_REPLY_LABEL);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const length = charCount(body);
  const bodyErr = !body.trim()
    ? "Wpisz treść odpowiedzi."
    : length > BODY_MAX
      ? `Odpowiedź może mieć najwyżej ${BODY_MAX} znaków. Skróć ją o ${length - BODY_MAX} ${plural(length - BODY_MAX, "znak", "znaki", "znaków")}.`
      : null;
  const labelErr = charCount(label.trim()) > LABEL_MAX ? `Podpis może mieć najwyżej ${LABEL_MAX} znaków.` : null;
  // Przekroczenie limitu pokazujemy od razu; puste pole dopiero po próbie wysłania.
  const bodyMsg = submitted || length > BODY_MAX ? bodyErr : null;
  const labelMsg = labelErr;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSent("");
    setSendError(null);
    if (bodyErr || labelErr) {
      (bodyErr ? bodyRef : labelRef).current?.focus();
      return;
    }
    setBusy(true);
    try {
      await api.addIdeaReply(ideaId, { body, author_label: label.trim() || null });
      setBody("");
      setSubmitted(false);
      setSent("Wysłano. Autor zobaczy odpowiedź w zakładce Moje pomysły.");
      onSent();
    } catch (err) {
      setSendError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void submit(e)}>
      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.body}>
          Odpowiedź do autora
        </label>
        <textarea
          ref={bodyRef}
          id={ids.body}
          className="ds-textarea"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={bodyMsg ? true : undefined}
          aria-describedby={[bodyMsg ? ids.bodyError : null, ids.bodyCounter].filter(Boolean).join(" ")}
        />
        <p
          className="ds-counter"
          id={ids.bodyCounter}
          data-state={length >= BODY_MAX * COUNTER_WARN ? "limit" : undefined}
        >
          {length} z {BODY_MAX} znaków
        </p>
        {bodyMsg && (
          <p className="ds-error" id={ids.bodyError}>
            {bodyMsg}
          </p>
        )}
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.label}>
          Podpis
        </label>
        <p className="ds-hint" id={ids.labelHint}>
          Autor zobaczy go przy odpowiedzi. Możesz dopisać imię, np. Anna, Zespół Hubu.
        </p>
        <input
          ref={labelRef}
          id={ids.label}
          className="ds-input"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-invalid={labelMsg ? true : undefined}
          aria-describedby={[ids.labelHint, labelMsg ? ids.labelError : null].filter(Boolean).join(" ")}
        />
        {labelMsg && (
          <p className="ds-error" id={ids.labelError}>
            {labelMsg}
          </p>
        )}
      </div>

      <div>
        <button type="submit" className="ds-btn ds-btn--primary" disabled={busy}>
          {busy ? "Wysyłamy…" : "Wyślij odpowiedź"}
        </button>
      </div>

      <div aria-live="polite">{sent && <Alert tone="success">{sent}</Alert>}</div>
      {sendError && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się wysłać odpowiedzi.">
            {sendError}
          </Alert>
        </div>
      )}
    </form>
  );
}

/** Kanwa pomysłu tylko do odczytu, z zakładkami arkuszy (`?arkusz=1|2|3`). */
function CanvasPreview({ ideaId }: { ideaId: number }) {
  const [params] = useSearchParams();
  const loaded = useApi<[CanvasDefinition, CanvasState]>(
    () => Promise.all([loadCanvasDefinition(), api.canvas(ideaId)]),
    [ideaId],
  );
  const def = loaded.data?.[0];
  const state = loaded.data?.[1];
  const sheets = def?.sheets ?? [];
  const sheetIndex = parseSheet(params.get("arkusz"), Math.max(sheets.length, 1));
  const sheet = sheets[sheetIndex];

  return (
    <section aria-labelledby="idea-canvas" className="flex min-w-0 flex-col gap-4">
      <h2 id="idea-canvas" className="m-0 font-sans text-h2 text-navy">
        Social Canvas
      </h2>
      <LoadState loading={loaded.loading} error={loaded.error} onRetry={loaded.reload} label="Wczytujemy kanwę…">
        {def && state && sheet && (
          <>
            <div className="max-w-xl">
              <CanvasProgressBar label="Cała mapa" filled={state.progress.filled} total={state.progress.total} />
            </div>
            <nav aria-label="Arkusze Social Canvas">
              <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-3">
                {sheets.map((s, i) => {
                  const active = i === sheetIndex;
                  const p = state.progress.by_sheet[s.id];
                  return (
                    <li key={s.id} className="min-w-0">
                      <Link
                        to={`?arkusz=${i + 1}`}
                        replace
                        preventScrollReset
                        aria-current={active ? "page" : undefined}
                        className={`flex h-full flex-col gap-1 rounded-md border border-solid px-3 py-2 text-navy no-underline hover:bg-surface-sunken ${
                          active ? "border-navy bg-surface-muted shadow-[inset_0_-4px_0_var(--accent)]" : "border-line"
                        }`}
                      >
                        <span className="font-sans text-nav [overflow-wrap:anywhere]">{`Arkusz ${i + 1}: ${s.title}`}</span>
                        {p && <CanvasProgressBar label={`Arkusz ${i + 1}`} filled={p.filled} total={p.total} compact />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <CanvasBoard definition={def} blocks={state.blocks} sheet={sheet.id} readOnly headingLevel={3} />
          </>
        )}
      </LoadState>
    </section>
  );
}

// K11: panel — przegląd pomysłu: fiszka, status, odpowiedzi do autora, kanwa i podobne innowacje.
export function PanelIdeaReviewPage() {
  const id = parseId(useParams().id);
  const loaded = useApi<IdeaDetail>(
    () => (id === null ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono pomysłu.")) : api.idea(id)),
    [id],
  );
  const replies = useApi<IdeaReply[]>(() => (id === null ? Promise.resolve([]) : api.ideaReplies(id)), [id]);
  // Wynik zmiany statusu albo odświeżenia po odpowiedzi; dane z useApi tylko do pierwszego wczytania.
  const [override, setOverride] = useState<IdeaDetail | null>(null);
  const idea = override && override.id === id ? override : loaded.data;
  useDocumentTitle(idea ? `Panel: ${idea.title}` : id === null ? "Panel: Pomysł" : `Panel: Pomysł nr ${id}`);

  function afterReply() {
    replies.reload();
    // Odpowiedź przenosi SUBMITTED → IN_REVIEW: pobieramy pomysł ponownie, żeby pokazać nowy status.
    if (id !== null) void api.idea(id).then(setOverride, () => undefined);
  }

  const notFound = loaded.error?.status === 404;
  const replyCount = replies.data?.length ?? 0;

  return (
    <div className="ds-page">
      <header className="flex max-w-3xl flex-col gap-3">
        <Breadcrumbs id={id} />
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy [overflow-wrap:anywhere]">
          {idea ? idea.title : "Pomysł"}
        </h1>
        {idea && (
          <p className="m-0 flex flex-wrap items-center gap-3 text-body text-ink">
            <span>Pomysł nr {idea.id}</span>
            {idea.status === "SUBMITTED" ? <NewIdeaMarker /> : <IdeaStatusLabel status={idea.status} />}
          </p>
        )}
      </header>

      {notFound ? (
        <Alert tone="info" title="Nie znaleziono pomysłu.">
          <p>Sprawdź numer pomysłu albo wróć do listy.</p>
          <p>
            <Link to="/panel/pomysly">Przejdź do listy pomysłów</Link>
          </p>
        </Alert>
      ) : (
        <LoadState loading={loaded.loading && !idea} error={loaded.error} onRetry={loaded.reload} label="Wczytujemy pomysł…">
          {idea && id !== null && (
            <div className="flex min-w-0 flex-col gap-8">
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <IdeaCardSection idea={idea} />
                <div className="flex min-w-0 flex-col gap-6">
                  <IdeaStatusControl idea={idea} onChange={setOverride} />
                  <section aria-labelledby="idea-replies" className="ds-card flex flex-col gap-4">
                    <h2 id="idea-replies" className="m-0 font-sans text-h2 text-navy">
                      Odpowiedzi do autora
                    </h2>
                    <LoadState
                      loading={replies.loading && !replies.data}
                      error={replies.error}
                      onRetry={replies.reload}
                      label="Wczytujemy odpowiedzi…"
                    >
                      {replies.data &&
                        (replyCount === 0 ? (
                          <p className="m-0 text-body text-ink">
                            Hub jeszcze nie odpowiedział. Pierwsza odpowiedź zmieni status na „W analizie”.
                          </p>
                        ) : (
                          <ReplyList replies={asReplies(replies.data)} headingLevel={3} />
                        ))}
                    </LoadState>
                    <IdeaReplyForm ideaId={id} onSent={afterReply} />
                  </section>
                </div>
              </div>

              <CanvasPreview ideaId={id} />

              <SimilarInnovations ideaId={id} headingLevel={2} />
            </div>
          )}
        </LoadState>
      )}
    </div>
  );
}
