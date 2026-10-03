import { useCallback } from "react";
import type { ChatRequest } from "@/api/types";
import { ChatForm } from "@/components/chat/ChatForm";
import { ChatResults, RESULTS_HEADING_ID } from "@/components/chat/ChatResults";
import { useChat } from "@/hooks/useChat";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/styles/chat.css";

/** Sekcja wyników montuje się dopiero przy phase = "streaming", więc fokus po następnej klatce. */
function focusResults(): void {
  requestAnimationFrame(() => document.getElementById(RESULTS_HEADING_ID)?.focus());
}

/** Znajdź rozwiązanie: mieszkaniec opisuje problem, a pod formularzem rysują się wyniki (F09). */
export function FindPage() {
  useDocumentTitle("Znajdź rozwiązanie");
  const { state, send, followUp, abort } = useChat();

  const handleSubmit = useCallback(
    (input: Omit<ChatRequest, "session_id">) => {
      send(input);
      focusResults();
    },
    [send],
  );

  const handleFollowUp = useCallback(
    (text: string) => {
      followUp(text);
      focusResults();
    },
    [followUp],
  );

  return (
    <div className="ds-page find-page">
      <div className="find-page__intro">
        <h1 tabIndex={-1}>Opisz problem</h1>
        <p className="find-page__lead">
          Napisz własnymi słowami, co się dzieje. Pokażemy sprawdzone rozwiązania z Małopolski.
        </p>
      </div>

      <ChatForm
        streaming={state.phase === "streaming"}
        requestError={state.requestError}
        onSubmit={handleSubmit}
        onAbort={abort}
      />

      <ChatResults state={state} onFollowUp={handleFollowUp} />
    </div>
  );
}
