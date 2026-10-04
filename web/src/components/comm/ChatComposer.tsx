import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { COMM_COUNTER_FROM, COMM_MESSAGE_MAX_CHARS } from "@/lib/comm";

interface Props {
  /** Etykieta pola (widoczna dla czytnika ekranu; wizualnie zastępuje ją placeholder). */
  label: string;
  placeholder: string;
  /** Wysyła treść; rzucony błąd pokazujemy nad polem. Po sukcesie pole się czyści. */
  onSend(body: string): Promise<void>;
}

const MAX_ROWS = 6;

/**
 * Pole wiadomości jak w komunikatorze: przyklejone do dołu, rośnie z treścią, Enter wysyła,
 * Shift+Enter dodaje linię, okrągły przycisk „Wyślij”. Licznik znaków dopiero blisko limitu.
 */
export function ChatComposer({ label, placeholder, onSend }: Props) {
  const fieldId = useId();
  const hintId = useId();
  const counterId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = Math.min(MAX_ROWS, Math.max(1, text.split("\n").length));
  const nearLimit = text.length >= COMM_COUNTER_FROM;
  const canSend = text.trim().length > 0 && !sending;

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setText("");
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSending(false);
      fieldRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-0 border-t border-solid border-line bg-surface px-4 py-3"
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex items-end gap-2">
        <label htmlFor={fieldId} className="ds-sr-only">
          {label}
        </label>
        <textarea
          ref={fieldRef}
          id={fieldId}
          className="ds-textarea max-h-40 min-w-0 flex-1 resize-none rounded-lg [field-sizing:content]"
          rows={rows}
          maxLength={COMM_MESSAGE_MAX_CHARS}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          aria-describedby={nearLimit ? `${hintId} ${counterId}` : hintId}
          aria-invalid={error ? true : undefined}
        />
        <button
          type="submit"
          className="ds-btn ds-btn--primary h-12 w-12 shrink-0 rounded-pill p-0"
          disabled={!canSend}
          aria-busy={sending || undefined}
          aria-label={sending ? "Wysyłanie…" : "Wyślij"}
          title="Wyślij"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-6 w-6 fill-current">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </div>
      <p className="m-0 flex flex-wrap justify-between gap-2 text-small text-ink-muted">
        <span id={hintId}>Enter — wyślij, Shift+Enter — nowa linia</span>
        {nearLimit && (
          <span id={counterId} aria-live="polite">
            {text.length} z {COMM_MESSAGE_MAX_CHARS} znaków
          </span>
        )}
      </p>
    </form>
  );
}
