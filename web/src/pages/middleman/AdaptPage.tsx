// Moduł 7: Middleman innowacji — rozmowa z asystentem o wdrożeniu jednej innowacji `/wdrozenie/:id`.
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { AdaptContext } from "@/api/middleman";
import type { SolutionDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { ChatComposer } from "@/components/comm/ChatComposer";
import { ChatShell } from "@/components/comm/ChatShell";
import { QuickReplies } from "@/components/comm/QuickReplies";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { AdaptTimeline } from "@/components/middleman/AdaptTimeline";
import { InstitutionContext } from "@/components/middleman/InstitutionContext";
import { useAdaptChat } from "@/hooks/useAdaptChat";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  MIDDLEMAN_AI_NOTE,
  MIDDLEMAN_PATH,
  MIDDLEMAN_QUICK_QUESTIONS,
  middlemanGreeting,
} from "@/lib/middleman";

const UNAVAILABLE_TITLE = "Asystent działa dla innowacji z Biblioteki";

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Pasek na dole ekranu zamiast pola wiadomości (ten sam układ co `ChatComposer`). */
const FOOTER_BAR =
  "sticky bottom-0 z-10 -mx-4 flex flex-col items-start gap-3 border-0 border-t border-solid border-line bg-surface px-4 py-3";

export function AdaptPage() {
  const id = parseId(useParams().id);
  const { data, error, loading, reload } = useApi<SolutionDetail>(
    () =>
      id === null
        ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono innowacji."))
        : api.solution(id),
    [id],
  );
  const unavailable = error?.status === 404 || data?.kind === "KNOWLEDGE";
  useDocumentTitle(
    unavailable ? UNAVAILABLE_TITLE : data ? `Jak wdrożyć: ${data.title}` : "Middleman innowacji",
  );

  if (unavailable) {
    return (
      <div className="ds-page">
        <h1 tabIndex={-1} className="m-0 text-h1 text-navy">
          {UNAVAILABLE_TITLE}
        </h1>
        <div role="status">
          <EmptyState title="Pod tym adresem nie ma innowacji, o której można porozmawiać.">
            <p>
              Asystent podpowiada, jak wdrożyć innowacje z Biblioteki ROPS.{" "}
              <Link to={MIDDLEMAN_PATH}>Wybierz innowację</Link>
            </p>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy innowację…" />
      </div>
    );
  }

  return <AdaptChat key={data.id} solution={data} />;
}

function AdaptChat({ solution }: { solution: SolutionDetail }) {
  const [context, setContext] = useState<AdaptContext>({ reporter_type: "OTHER", gmina: null });
  const chat = useAdaptChat(solution.id, context);
  const solutionPath = `/rozwiazania/${solution.id}`;

  // Pole wiadomości znika na czas odpowiedzi — fokus nie może zostać „w powietrzu”.
  const footerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const wasStreaming = useRef(chat.streaming);
  useEffect(() => {
    if (wasStreaming.current === chat.streaming) return;
    wasStreaming.current = chat.streaming;
    const active = document.activeElement;
    const lost = !active || active === document.body;
    if (!lost && !footerRef.current?.contains(active)) return;
    if (chat.streaming) statusRef.current?.focus();
    else footerRef.current?.querySelector<HTMLElement>("textarea, button")?.focus();
  }, [chat.streaming]);

  function startOver() {
    chat.reset();
    // Przycisk znika razem z informacją o limicie — fokus wraca do pola wiadomości.
    requestAnimationFrame(() => footerRef.current?.querySelector<HTMLElement>("textarea")?.focus());
  }

  const asked = new Set(chat.messages.filter((m) => m.role === "user").map((m) => m.content));
  const questions = MIDDLEMAN_QUICK_QUESTIONS.filter((q) => !asked.has(q));
  const showQuestions = !chat.streaming && !chat.limitReached && questions.length > 0;

  let footer;
  if (chat.streaming) {
    footer = (
      <div className={FOOTER_BAR}>
        <p ref={statusRef} tabIndex={-1} className="m-0 text-body text-ink-muted">
          Asystent odpowiada…
        </p>
      </div>
    );
  } else if (chat.limitReached) {
    footer = (
      <div className={FOOTER_BAR}>
        <p className="m-0 text-body text-ink">
          Ta rozmowa jest już długa. Zacznij nową, żeby asystent dobrze pamiętał kontekst.
        </p>
        <button type="button" className="ds-btn ds-btn--primary" onClick={startOver}>
          Zacznij nową rozmowę
        </button>
      </div>
    );
  } else {
    footer = (
      <ChatComposer
        label="Twoje pytanie do asystenta"
        placeholder="Napisz pytanie o wdrożenie tej innowacji…"
        onSend={(text) => {
          void chat.send(text);
          return Promise.resolve();
        }}
      />
    );
  }

  return (
    <ChatShell
      back={{ to: solutionPath, label: "Opis innowacji" }}
      title={`Jak wdrożyć: ${solution.title}`}
      meta={solution.category_label_pl ? <span>{solution.category_label_pl}</span> : undefined}
      aside={<InstitutionContext value={context} onChange={setContext} solutionId={solution.id} />}
      announcement={chat.lastAnswer ?? undefined}
      footer={
        <div ref={footerRef} className="contents">
          {footer}
        </div>
      }
    >
      <Alert tone="info" title="Asystent AI:">
        {MIDDLEMAN_AI_NOTE}
      </Alert>
      <AdaptTimeline
        greeting={middlemanGreeting(solution.title)}
        messages={chat.messages}
        pending={chat.pending}
        streaming={chat.streaming}
      />
      {showQuestions && (
        <QuickReplies replies={questions.map((q) => ({ label: q, onClick: () => void chat.send(q) }))} />
      )}
      {chat.error && (
        <div role="alert">
          {chat.error.code === "ASSISTANT_UNAVAILABLE" ? (
            <Alert tone="warning" title="Asystent niedostępny:">
              <p>{chat.error.message_pl}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                <Link to={solutionPath}>Opis innowacji</Link>
                <Link to="/rozmowy/nowa">Napisz do zespołu Hubu</Link>
              </p>
            </Alert>
          ) : (
            <Alert tone="danger">
              <p>{chat.error.message_pl}</p>
              <p>
                <button type="button" className="ds-btn" onClick={() => void chat.retry()}>
                  Spróbuj ponownie
                </button>
              </p>
            </Alert>
          )}
        </div>
      )}
    </ChatShell>
  );
}
