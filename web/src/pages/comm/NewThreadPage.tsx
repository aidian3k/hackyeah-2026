import { useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { commApi, type ThreadMessage } from "@/api/comm";
import type { ReporterType } from "@/api/types";
import { ReporterTypeField } from "@/components/chat/ReporterTypeField";
import { ChatComposer } from "@/components/comm/ChatComposer";
import { ChatShell } from "@/components/comm/ChatShell";
import { Timeline } from "@/components/comm/Timeline";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { rememberThread } from "@/lib/comm";
import { PRIVACY_WARNING } from "@/lib/labels";
import { getSessionId } from "@/lib/storage";

const GREETING_QUESTION =
  "Dzień dobry! Napisz, w czym możemy pomóc. Asystent od razu poszuka odpowiedzi w Bibliotece Innowacji, a jeśli to nie wystarczy, odpisze zespół Hubu.";
const GREETING_MENTORING =
  "Dzień dobry! Opisz, w czym potrzebujesz wsparcia. Zespół Hubu dobierze eksperta z tej dziedziny, który odpowie w tej rozmowie.";

/** Moduł 5: nowa rozmowa jak pusty czat — powitanie od Hubu i pole wiadomości na dole. */
export function NewThreadPage() {
  const [params] = useSearchParams();
  const mentoring = params.get("rodzaj") === "ekspert";
  const title = mentoring ? "Poproś o eksperta" : "Zadaj pytanie";
  useDocumentTitle(title);
  const navigate = useNavigate();
  const signatureId = useId();
  const reporterName = useId();
  const [reporterType, setReporterType] = useState<ReporterType>("OTHER");
  const [signature, setSignature] = useState("");

  // Powitanie pokazane jako wiadomość Hubu (nie jest zapisywane w bazie).
  const greeting = useMemo<ThreadMessage[]>(
    () => [
      {
        id: 0,
        role: "STAFF",
        author_label: null,
        mentor: null,
        body: mentoring ? GREETING_MENTORING : GREETING_QUESTION,
        cards: [],
        created_at: new Date().toISOString(),
      },
    ],
    [mentoring],
  );

  async function send(body: string) {
    const thread = await commApi.createThread({
      kind: mentoring ? "MENTORING" : "QUESTION",
      body,
      reporter_type: reporterType,
      author_label: signature.trim() || null,
      session_id: getSessionId(),
    });
    rememberThread({ thread_id: thread.id, created_at: thread.created_at, excerpt: thread.subject });
    navigate(`/rozmowy/${thread.id}`);
  }

  return (
    <ChatShell
      back={{ to: "/rozmowy", label: "Platforma komunikacji" }}
      title={title}
      meta={<span>{PRIVACY_WARNING}</span>}
      footer={
        <ChatComposer
          label={mentoring ? "W czym potrzebujesz wsparcia eksperta?" : "Twoje pytanie"}
          placeholder={mentoring ? "Opisz, w czym potrzebujesz wsparcia…" : "Napisz pytanie…"}
          onSend={send}
        />
      }
    >
      <Timeline messages={greeting} viewer="author" />
      <details className="rounded-md border border-solid border-line px-4 py-3">
        <summary className="cursor-pointer text-label">Więcej opcji (kim jesteś, podpis)</summary>
        <div className="mt-3 flex flex-col gap-4">
          <ReporterTypeField name={reporterName} value={reporterType} onChange={setReporterType} />
          <div className="ds-field">
            <label className="ds-label" htmlFor={signatureId}>
              Podpis (opcjonalnie)
            </label>
            <p id={`${signatureId}-hint`} className="ds-hint">
              Np. nazwa organizacji albo gminy. Nie podawaj nazwiska, jeśli nie chcesz.
            </p>
            <input
              id={signatureId}
              className="ds-input max-w-lg"
              maxLength={100}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              aria-describedby={`${signatureId}-hint`}
            />
          </div>
        </div>
      </details>
    </ChatShell>
  );
}
