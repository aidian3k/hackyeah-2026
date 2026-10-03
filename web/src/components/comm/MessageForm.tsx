import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { COMM_MESSAGE_MAX_CHARS } from "@/lib/comm";

interface Props {
  label: string;
  submitLabel: string;
  /** Wysyła treść; rzucony błąd pokazujemy pod formularzem. Po sukcesie pole się czyści. */
  onSend(body: string): Promise<void>;
  /** Dodatkowe pola nad przyciskiem (np. podpis). */
  extra?: ReactNode;
  hint?: string;
  rows?: number;
}

const ANNOUNCE_FROM = COMM_MESSAGE_MAX_CHARS - 200;

/** Pole wiadomości z licznikiem znaków, stanem wysyłania i błędem. */
export function MessageForm({ label, submitLabel, onSend, extra, hint, rows = 4 }: Props) {
  const fieldId = useId();
  const hintId = useId();
  const counterId = useId();
  const errorId = useId();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = text.length;
  const nearLimit = count >= ANNOUNCE_FROM;
  const counterText = `${count} z ${COMM_MESSAGE_MAX_CHARS} znaków`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Wpisz treść wiadomości.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setText("");
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSending(false);
    }
  }

  const describedBy = [hint ? hintId : null, counterId, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="ds-field">
        <label className="ds-label" htmlFor={fieldId}>
          {label}
        </label>
        {hint && (
          <p id={hintId} className="ds-hint">
            {hint}
          </p>
        )}
        <textarea
          id={fieldId}
          className="ds-textarea"
          rows={rows}
          maxLength={COMM_MESSAGE_MAX_CHARS}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <p id={counterId} className="ds-counter" data-state={nearLimit ? "limit" : undefined}>
          {counterText}
        </p>
        <p className="ds-sr-only" aria-live="polite">
          {nearLimit ? counterText : ""}
        </p>
      </div>
      {extra}
      {error && (
        <div id={errorId}>
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <p className="m-0">
        <button type="submit" className="ds-btn ds-btn--primary" disabled={sending} aria-busy={sending || undefined}>
          {sending ? "Wysyłamy…" : submitLabel}
        </button>
      </p>
    </form>
  );
}
