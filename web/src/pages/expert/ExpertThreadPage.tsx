import { Link, useParams } from "react-router-dom";
import { commApi } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { MessageForm } from "@/components/comm/MessageForm";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useThread } from "@/hooks/useThread";
import { useAuth } from "@/lib/auth";
import { THREAD_KIND_LABELS } from "@/lib/comm";

/** Moduł 5: rozmowa widziana przez eksperta; pisać może tylko ekspert przydzielony do rozmowy. */
export function ExpertThreadPage() {
  const id = Number(useParams().id);
  const { session } = useAuth();
  const mentorId = session?.mentorId ?? null;
  const thread = useThread(id, { viewer: "mentor" });
  useDocumentTitle(thread.data?.subject ?? "Konsultacja");
  const d = thread.data;
  const assigned = d !== null && mentorId !== null && d.assigned_mentor?.id === mentorId;

  async function reply(body: string) {
    await commApi.addMessage(id, { role: "MENTOR", body, mentor_id: mentorId });
    await thread.refresh();
  }

  return (
    <div className="ds-page max-w-3xl">
      <p className="m-0">
        <Link to="/ekspert">Moje konsultacje</Link> › Rozmowa
      </p>
      <LoadState loading={thread.loading && !d} error={d ? null : thread.error} onRetry={() => void thread.refresh()}>
        {d && (
          <>
            <header className="flex flex-col gap-3">
              <ModuleLabel module="komunikacja" />
              <h1 tabIndex={-1} className="m-0 [overflow-wrap:anywhere]">
                {d.subject}
              </h1>
              <p className="m-0 flex flex-wrap items-center gap-3 text-small text-ink-muted">
                <span>{THREAD_KIND_LABELS[d.kind]}</span>
                <ThreadStatus status={d.status} viewer="mentor" />
                {d.category_label_pl && <span>{d.category_label_pl}</span>}
              </p>
            </header>
            <p className="ds-sr-only" aria-live="polite">
              {thread.announcement}
            </p>
            <Timeline messages={d.messages} viewer="mentor" />
            {!assigned ? (
              <Alert tone="info">Nie jesteś przydzielony do tej rozmowy, więc możesz ją tylko czytać.</Alert>
            ) : d.status === "CLOSED" ? (
              <Alert tone="info">Rozmowa jest zamknięta.</Alert>
            ) : (
              <MessageForm label="Odpowiedź eksperta" submitLabel="Wyślij odpowiedź" onSend={reply} />
            )}
          </>
        )}
      </LoadState>
    </div>
  );
}
