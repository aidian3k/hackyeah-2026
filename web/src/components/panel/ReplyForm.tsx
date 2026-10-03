import { useId, useRef, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { Reply } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { plural } from "@/lib/format";

/** Limity backendu (ReplyCreate): body 1..4000, author_label ..100 znaków. */
const BODY_MAX = 4000;
const LABEL_MAX = 100;
/** Licznik wyróżniony od 90% limitu. */
const COUNTER_WARN = 0.9;

/** Długość w znakach jak w backendzie (punkty kodowe, nie jednostki UTF-16). */
function charCount(text: string): number {
  return [...text].length;
}

function bodyError(body: string): string | null {
  const n = charCount(body);
  if (!body.trim()) return "Wpisz treść odpowiedzi.";
  if (n > BODY_MAX) {
    const over = n - BODY_MAX;
    return `Odpowiedź może mieć najwyżej ${BODY_MAX} znaków. Skróć ją o ${over} ${plural(over, "znak", "znaki", "znaków")}.`;
  }
  return null;
}

function labelError(label: string): string | null {
  return charCount(label.trim()) > LABEL_MAX ? `Podpis może mieć najwyżej ${LABEL_MAX} znaków.` : null;
}

interface Props {
  reportId: number;
  /** Wysłana odpowiedź (strona dopisuje ją do listy i odświeża status). */
  onSent(reply: Reply): void;
}

/** Odpowiedź zespołu Hubu do autora zgłoszenia. Autor widzi ją w „Moich zgłoszeniach”. */
export function ReplyForm({ reportId, onSent }: Props) {
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
  const [label, setLabel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const length = charCount(body);
  const overLimit = length > BODY_MAX;
  // Przekroczenie limitu pokazujemy od razu; puste pole dopiero po próbie wysłania.
  const bodyMsg = submitted || overLimit ? bodyError(body) : null;
  const labelMsg = submitted || charCount(label.trim()) > LABEL_MAX ? labelError(label) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSent("");
    setSendError(null);
    const bErr = bodyError(body);
    const lErr = labelError(label);
    if (bErr || lErr) {
      (bErr ? bodyRef : labelRef).current?.focus();
      return;
    }
    setBusy(true);
    try {
      const reply = await api.addReply(reportId, { body, author_label: label.trim() || null });
      setBody("");
      setSubmitted(false);
      setSent("Wysłano. Autor zobaczy odpowiedź w zakładce Moje zgłoszenia.");
      onSent(reply);
    } catch (err) {
      setSendError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ds-stack" noValidate onSubmit={(e) => void submit(e)}>
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
          Podpis (opcjonalnie)
        </label>
        <p className="ds-hint" id={ids.labelHint}>
          np. Anna, ROPS. Autor zobaczy go jako dopisek.
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
