import { useId, useState } from "react";
import { api } from "@/api/client";

interface Props {
  searchEventId: number;
}

type SendState = "idle" | "sending" | "sent" | "failed";

/**
 * „Czy te propozycje Ci pomogły?” — Tak / Nie → POST /api/feedback.
 * Przyciski zostają na miejscu (fokus nie ginie), wybrany ma aria-pressed.
 * Błąd zapisu pokazujemy cicho, bez blokowania ekranu. Stan zeruje się przez `key` w rodzicu.
 */
export function FeedbackPrompt({ searchEventId }: Props) {
  const questionId = useId();
  const [state, setState] = useState<SendState>("idle");
  const [choice, setChoice] = useState<boolean | null>(null);
  const locked = state === "sending" || state === "sent";

  const send = (helpful: boolean) => {
    if (locked) return;
    setChoice(helpful);
    setState("sending");
    api
      .feedback({ search_event_id: searchEventId, helpful })
      .then(() => setState("sent"))
      .catch(() => setState("failed"));
  };

  const button = (helpful: boolean, label: string) => (
    <button
      type="button"
      className="ds-btn"
      onClick={() => send(helpful)}
      aria-pressed={choice === helpful && state !== "failed"}
      aria-disabled={locked || undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="feedback-prompt">
      <div className="ds-cluster" role="group" aria-labelledby={questionId}>
        <p id={questionId} className="feedback-prompt__question">
          Czy te propozycje Ci pomogły?
        </p>
        {button(true, "Tak")}
        {button(false, "Nie")}
      </div>
      <p className="feedback-prompt__status" aria-live="polite">
        {state === "sent" && "Dziękujemy za odpowiedź."}
        {state === "failed" && "Nie udało się zapisać odpowiedzi."}
      </p>
    </div>
  );
}
