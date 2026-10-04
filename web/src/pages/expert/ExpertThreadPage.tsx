import { useParams } from "react-router-dom";
import { commApi } from "@/api/comm";
import { ChatComposer } from "@/components/comm/ChatComposer";
import { ChatShell } from "@/components/comm/ChatShell";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { TypingBubble } from "@/components/comm/TypingBubble";
import { LoadState } from "@/components/LoadState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useThread } from "@/hooks/useThread";
import { useAuth } from "@/lib/auth";
import { THREAD_KIND_LABELS } from "@/lib/comm";

/** Moduł 5: rozmowa widziana przez eksperta — czat; pisać może tylko ekspert przydzielony do rozmowy. */
export function ExpertThreadPage() {
  const id = Number(useParams().id);
  const { session } = useAuth();
  const mentorId = session?.mentorId ?? null;
  const thread = useThread(id, { viewer: "mentor" });
  useDocumentTitle(thread.data?.subject ?? "Konsultacja");
  const d = thread.data;

  async function reply(body: string) {
    await commApi.addMessage(id, { role: "MENTOR", body, mentor_id: mentorId });
    await thread.refresh();
  }

  if (!d) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <LoadState loading={thread.loading} error={thread.error} onRetry={() => void thread.refresh()} />
      </div>
    );
  }

  const assigned = mentorId !== null && d.assigned_mentor?.id === mentorId;
  const blocked = !assigned
    ? "Nie jesteś przydzielony do tej rozmowy, więc możesz ją tylko czytać."
    : d.status === "CLOSED"
      ? "Rozmowa jest zamknięta."
      : null;

  return (
    <ChatShell
      back={{ to: "/ekspert", label: "Moje konsultacje" }}
      title={d.subject}
      announcement={thread.announcement}
      meta={
        <>
          <span>{THREAD_KIND_LABELS[d.kind]}</span>
          <ThreadStatus status={d.status} viewer="mentor" />
          {d.category_label_pl && <span>{d.category_label_pl}</span>}
        </>
      }
      footer={
        blocked ? (
          <p className="sticky bottom-0 -mx-4 m-0 border-0 border-t border-solid border-line bg-surface px-4 py-3 text-ink-muted">
            {blocked}
          </p>
        ) : (
          <ChatComposer label="Odpowiedź eksperta" placeholder="Napisz odpowiedź…" onSend={reply} />
        )
      }
    >
      <Timeline
        messages={d.messages}
        viewer="mentor"
        scrollKey={d.status}
        after={d.status === "AI_PENDING" ? <TypingBubble /> : undefined}
      />
    </ChatShell>
  );
}
