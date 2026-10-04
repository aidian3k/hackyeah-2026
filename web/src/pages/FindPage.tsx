import { useCallback } from "react";
import type { ChatRequest } from "@/api/types";
import { ChatForm } from "@/components/chat/ChatForm";
import { ChatResults, RESULTS_HEADING_ID } from "@/components/chat/ChatResults";
import { MatchmakingMark } from "@/components/chat/MatchmakingMark";
import { useChat } from "@/hooks/useChat";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ModuleLabel } from "@/components/layout/ModuleLabel";

/** Sekcja wyników montuje się dopiero przy phase = "streaming", więc fokus po następnej klatce. */
function focusResults(): void {
  requestAnimationFrame(() => document.getElementById(RESULTS_HEADING_ID)?.focus());
}

const HOW_IT_WORKS: { title: string; text: string }[] = [
  { title: "Opisz problem", text: "Własnymi słowami, bez imion i adresów. Wystarczy kilka zdań." },
  {
    title: "Dopasujemy rozwiązania",
    text: "Przeszukamy Bibliotekę ROPS i pokażemy sprawdzone pomysły z Małopolski ze źródłami.",
  },
  { title: "Doprecyzuj albo działaj", text: "Dopisz szczegóły, otwórz kartę rozwiązania i skontaktuj się z autorami." },
];

/** „Jak to działa” obok formularza — tylko przed pierwszym wyszukiwaniem. */
function HowItWorks() {
  return (
    <section aria-labelledby="jak-to-dziala" className="flex flex-col gap-4 rounded-lg bg-soft-blue p-6">
      <h2 id="jak-to-dziala" className="m-0 text-h3 text-navy">
        Jak to działa
      </h2>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-pill bg-navy text-label text-navy-on"
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-body font-bold text-ink">{step.title}</h3>
              <p className="m-0 text-small text-ink">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
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
    <div className="ds-page">
      <div className="grid items-start gap-8 lg:grid-cols-3 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <MatchmakingMark className="h-16 w-16 flex-none" />
              <div className="flex flex-col gap-1">
                <ModuleLabel module="matchmaking" />
                <h1 tabIndex={-1} className="m-0 text-h1 text-navy">
                  Opisz problem
                </h1>
              </div>
            </div>
            <p className="m-0 text-body-lg text-ink">
              Napisz własnymi słowami, co się dzieje. Pokażemy sprawdzone rozwiązania z Małopolski.
            </p>
          </header>

          <ChatForm
            streaming={state.phase === "streaming"}
            requestError={state.requestError}
            onSubmit={handleSubmit}
            onAbort={abort}
          />
        </div>

        {state.phase === "idle" && <HowItWorks />}
      </div>

      <ChatResults state={state} onFollowUp={handleFollowUp} />
    </div>
  );
}
