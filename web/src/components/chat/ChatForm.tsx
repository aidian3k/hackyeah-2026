import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ApiError } from "@/api/client";
import type { ChatRequest } from "@/api/types";
import { EXAMPLE_PROMPTS, MESSAGE_MAX_CHARS, PRIVACY_WARNING } from "@/lib/labels";

interface Props {
  streaming: boolean;
  /** Błąd przed strumieniem z useChat; 422 pokazujemy przy właściwym polu. */
  requestError: ApiError | null;
  onSubmit(input: Omit<ChatRequest, "session_id">): void;
  onAbort(): void;
}

const EMPTY_MESSAGE = "Opisz problem w kilku słowach.";
const INVALID_MESSAGE = `Opisz problem w kilku słowach, najwyżej ${MESSAGE_MAX_CHARS} znaków.`;
// Licznik znaków ogłaszamy czytnikom dopiero od 90% limitu.
const COUNTER_ANNOUNCE_FROM = Math.ceil(MESSAGE_MAX_CHARS * 0.9);

/** Formularz „Opisz problem”: jedno pole opisu i przycisk w jednej karcie, pod nią przykłady. */
export function ChatForm({ streaming, requestError, onSubmit, onAbort }: Props) {
  const id = useId();
  const messageId = `${id}-opis`;
  const privacyId = `${id}-prywatnosc`;
  const messageErrorId = `${id}-opis-blad`;
  const examplesId = `${id}-przyklady`;

  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  // Błąd 422 z backendu znika, gdy użytkownik poprawi pole (bez kopiowania go do stanu w efekcie).
  const [dismissed, setDismissed] = useState<ApiError | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const serverError = requestError && requestError.status === 422 && requestError !== dismissed ? requestError : null;
  const messageError = localError ?? (serverError ? INVALID_MESSAGE : null);

  // Po odrzuceniu żądania (422) fokus wraca do pola opisu.
  useEffect(() => {
    if (serverError) messageRef.current?.focus();
  }, [serverError]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (streaming) return; // aria-disabled: przycisk zostaje w kolejności Tab, ale nic nie robi
    const message = text.trim();
    if (!message) {
      setLocalError(EMPTY_MESSAGE);
      messageRef.current?.focus();
      return;
    }
    setLocalError(null);
    onSubmit({ message });
  };

  const abort = () => {
    onAbort();
    messageRef.current?.focus();
  };

  const insertExample = (example: string) => {
    setText(example);
    setLocalError(null);
    if (serverError) setDismissed(requestError);
    messageRef.current?.focus();
  };

  const count = text.length;
  const nearLimit = count >= COUNTER_ANNOUNCE_FROM;
  const counterText = `${count} z ${MESSAGE_MAX_CHARS} znaków`;
  const describedBy = [privacyId, messageError ? messageErrorId : null].filter(Boolean).join(" ");

  return (
    <form className="flex min-w-0 flex-col gap-6" onSubmit={submit} noValidate aria-label="Opisz problem">
      <div className="ds-field gap-3 rounded-lg border border-line bg-surface-muted p-4 shadow-card md:p-6">
        <label className="ds-label text-h3 text-ink" htmlFor={messageId}>
          Co się dzieje w Twojej okolicy?
        </label>
        <textarea
          ref={messageRef}
          id={messageId}
          className="ds-textarea resize-y bg-surface text-body-lg"
          rows={5}
          maxLength={MESSAGE_MAX_CHARS}
          placeholder="Np. kogo dotyczy problem, od kiedy trwa, czego brakuje"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (localError) setLocalError(null);
            if (serverError) setDismissed(requestError);
          }}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={describedBy}
        />
        {messageError && (
          <p id={messageErrorId} className="ds-error">
            {messageError}
          </p>
        )}
        <p id={privacyId} className="m-0 flex items-start gap-2 text-small text-ink-muted">
          <svg
            className="mt-px h-4 w-4 flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>{PRIVACY_WARNING}</span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="ds-btn ds-btn--cta aria-disabled:cursor-progress"
              aria-disabled={streaming ? true : undefined}
            >
              {streaming ? "Szukam…" : "Znajdź rozwiązania"}
            </button>
            {streaming && (
              <button type="button" className="ds-btn ds-btn--link" onClick={abort}>
                Przerwij
              </button>
            )}
          </div>
          <p className="ds-counter m-0" data-state={nearLimit ? "limit" : undefined}>
            {counterText}
          </p>
          <p className="ds-sr-only" aria-live="polite">
            {nearLimit ? counterText : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p id={examplesId} className="m-0 text-body text-ink-muted">
          Nie wiesz, od czego zacząć? Wybierz przykład, wstawimy go do pola:
        </p>
        <ul className="ds-cluster m-0 list-none p-0" aria-labelledby={examplesId}>
          {EXAMPLE_PROMPTS.map((example) => (
            <li key={example} className="max-w-full">
              <button
                type="button"
                className="ds-chip max-w-full whitespace-normal text-start [overflow-wrap:anywhere]"
                onClick={() => insertExample(example)}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </form>
  );
}
