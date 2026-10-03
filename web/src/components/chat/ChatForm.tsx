import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { ApiError } from "@/api/client";
import type { ChatRequest, ReporterType } from "@/api/types";
import { Alert } from "@/components/Alert";
import { GminaSelect } from "@/components/GminaSelect";
import { ReporterTypeField } from "@/components/chat/ReporterTypeField";
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
const INVALID_GMINA = "Wybierz gminę z listy albo zostaw „Nie wybrano”.";
// Licznik znaków ogłaszamy czytnikom dopiero od 90% limitu.
const COUNTER_ANNOUNCE_FROM = Math.ceil(MESSAGE_MAX_CHARS * 0.9);

type ServerField = "message" | "gmina";

function serverFieldOf(error: ApiError): ServerField {
  // Backend: {"error": {"code": "VALIDATION_ERROR", "message": "gmina: nieznana gmina 'X'."}}
  return error.message.trim().startsWith("gmina:") ? "gmina" : "message";
}

const MOCK_SCENARIOS = ["match", "no-match", "retracted", "error"] as const;

/** Tylko w trybie DEV: przełącznik scenariusza mocka (`?scenario=` → /api/chat?scenario=…). */
function DevScenarioSwitch() {
  const id = useId();
  const [params, setParams] = useSearchParams();
  const current = params.get("scenario") ?? "";
  return (
    <div className="ds-field chat-form__dev">
      <label className="ds-label" htmlFor={id}>
        Scenariusz mocka (tylko tryb deweloperski)
      </label>
      <select
        id={id}
        className="ds-select"
        value={current}
        onChange={(e) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set("scenario", e.target.value);
              else next.delete("scenario");
              return next;
            },
            { replace: true },
          )
        }
      >
        <option value="">Bez scenariusza (API z proxy)</option>
        {MOCK_SCENARIOS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Formularz „Opisz problem”: opis, gmina (opcjonalnie), „Zgłaszam jako” (opcjonalnie). */
export function ChatForm({ streaming, requestError, onSubmit, onAbort }: Props) {
  const id = useId();
  const messageId = `${id}-opis`;
  const privacyId = `${id}-prywatnosc`;
  const messageErrorId = `${id}-opis-blad`;
  const counterId = `${id}-licznik`;
  const examplesId = `${id}-przyklady`;
  const gminaId = `${id}-gmina`;

  const [text, setText] = useState("");
  const [gmina, setGmina] = useState<string | null>(null);
  const [reporterType, setReporterType] = useState<ReporterType>("OTHER");
  const [localError, setLocalError] = useState<string | null>(null);
  // Błąd 422 z backendu znika, gdy użytkownik poprawi pole (bez kopiowania go do stanu w efekcie).
  const [dismissed, setDismissed] = useState<ApiError | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const serverError = requestError && requestError.status === 422 && requestError !== dismissed ? requestError : null;
  const serverField = serverError ? serverFieldOf(serverError) : null;

  const messageError = localError ?? (serverField === "message" ? INVALID_MESSAGE : null);
  const gminaError = serverField === "gmina" ? INVALID_GMINA : undefined;

  // Po odrzuceniu żądania (422) fokus idzie do pola, którego dotyczy błąd.
  useEffect(() => {
    if (!serverError) return;
    if (serverFieldOf(serverError) === "gmina") document.getElementById(gminaId)?.focus();
    else messageRef.current?.focus();
  }, [serverError, gminaId]);

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
    onSubmit({ message, gmina, reporter_type: reporterType });
  };

  const abort = () => {
    onAbort();
    messageRef.current?.focus();
  };

  const insertExample = (example: string) => {
    setText(example);
    setLocalError(null);
    if (serverField === "message") setDismissed(requestError);
    messageRef.current?.focus();
  };

  const count = text.length;
  const nearLimit = count >= COUNTER_ANNOUNCE_FROM;
  const counterText = `${count} z ${MESSAGE_MAX_CHARS} znaków`;
  const describedBy = [privacyId, messageError ? messageErrorId : null].filter(Boolean).join(" ");

  return (
    <form className="chat-form" onSubmit={submit} noValidate aria-label="Opisz problem">
      <div className="ds-field">
        <label className="ds-label chat-form__label" htmlFor={messageId}>
          Co się dzieje w Twojej okolicy?
        </label>
        <textarea
          ref={messageRef}
          id={messageId}
          className="ds-textarea chat-form__message"
          rows={4}
          maxLength={MESSAGE_MAX_CHARS}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (localError) setLocalError(null);
            if (serverField === "message") setDismissed(requestError);
          }}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={describedBy}
        />
        {messageError && (
          <p id={messageErrorId} className="ds-error">
            {messageError}
          </p>
        )}
        <p id={counterId} className="ds-counter" data-state={nearLimit ? "limit" : undefined}>
          {counterText}
        </p>
        <p className="ds-sr-only" aria-live="polite">
          {nearLimit ? counterText : ""}
        </p>
        <div id={privacyId} className="chat-form__privacy">
          <Alert tone="warning">{PRIVACY_WARNING}</Alert>
        </div>
      </div>

      <div className="chat-form__examples">
        <p id={examplesId} className="chat-form__examples-label">
          Przykłady (wstawiają tekst do pola):
        </p>
        <ul className="ds-cluster chat-form__chips" aria-labelledby={examplesId}>
          {EXAMPLE_PROMPTS.map((example) => (
            <li key={example}>
              <button type="button" className="ds-chip" onClick={() => insertExample(example)}>
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <GminaSelect
        id={gminaId}
        value={gmina}
        onChange={(v) => {
          setGmina(v);
          if (serverField === "gmina") setDismissed(requestError);
        }}
        label="Gmina, której dotyczy problem (opcjonalnie)"
        error={gminaError}
      />

      <ReporterTypeField name={`${id}-zglaszam`} value={reporterType} onChange={setReporterType} />

      <div className="ds-cluster chat-form__actions">
        <button type="submit" className="ds-btn ds-btn--cta" aria-disabled={streaming ? true : undefined}>
          {streaming ? "Szukam…" : "Znajdź rozwiązania"}
        </button>
        {streaming && (
          <button type="button" className="ds-btn ds-btn--link" onClick={abort}>
            Przerwij
          </button>
        )}
      </div>

      {import.meta.env?.DEV && <DevScenarioSwitch />}
    </form>
  );
}
