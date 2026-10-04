import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { commApi } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { ChatComposer } from "@/components/comm/ChatComposer";
import { ChatShell } from "@/components/comm/ChatShell";
import { QuickReplies } from "@/components/comm/QuickReplies";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { TypingBubble } from "@/components/comm/TypingBubble";
import { LoadState } from "@/components/LoadState";
import { toApiError } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useThread } from "@/hooks/useThread";
import { loginHref, useAuth } from "@/lib/auth";
import { rememberThread, THREAD_KIND_LABELS } from "@/lib/comm";

const BACK = { to: "/rozmowy", label: "Platforma komunikacji" };

/** Moduł 5: rozmowa widziana przez autora — jak w komunikatorze (publiczna po id; pisanie — reporter). */
export function ThreadPage() {
  const id = Number(useParams().id);
  const { session } = useAuth();
  const { pathname, search } = useLocation();
  const thread = useThread(id, { viewer: "author", markRead: true });
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(thread.data?.subject ?? "Rozmowa");

  const d = thread.data;
  const lastRole = d?.messages[d.messages.length - 1]?.role;
  const canWrite = session?.role === "reporter";

  async function setStatus(status: "WAITING_STAFF" | "CLOSED") {
    setBusy(true);
    setActionError(null);
    try {
      await commApi.patchThread(id, { status });
      await thread.refresh();
    } catch (err) {
      setActionError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function reply(body: string) {
    await commApi.addMessage(id, { role: "USER", body });
    if (d) rememberThread({ thread_id: d.id, created_at: d.created_at, excerpt: d.subject });
    await thread.refresh();
  }

  if (!d) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <LoadState loading={thread.loading} error={thread.error} onRetry={() => void thread.refresh()} />
      </div>
    );
  }

  const quickReplies = canWrite && d.status === "WAITING_USER" && lastRole === "ASSISTANT";

  let footer;
  if (d.status === "AI_PENDING") footer = null;
  else if (canWrite)
    footer = (
      <ChatComposer
        label={d.status === "CLOSED" ? "Napisz, aby otworzyć rozmowę ponownie" : "Twoja wiadomość"}
        placeholder={d.status === "CLOSED" ? "Rozmowa zamknięta — napisz, aby ją otworzyć…" : "Napisz wiadomość…"}
        onSend={reply}
      />
    );
  else
    footer = (
      <div className="sticky bottom-0 -mx-4 border-0 border-t border-solid border-line bg-surface px-4 py-3">
        <Link className="ds-btn ds-btn--primary" to={loginHref(pathname + search)}>
          Zaloguj się, aby odpowiedzieć
        </Link>
      </div>
    );

  return (
    <ChatShell
      back={BACK}
      title={d.subject}
      announcement={thread.announcement}
      meta={
        <>
          <span>{THREAD_KIND_LABELS[d.kind]}</span>
          <ThreadStatus status={d.status} viewer="author" />
          {d.partnership_id !== null && <Link to={`/partnerzy/${d.partnership_id}`}>Zobacz ogłoszenie</Link>}
        </>
      }
      footer={footer}
    >
      <Timeline
        messages={d.messages}
        viewer="author"
        scrollKey={d.status}
        after={
          <>
            {d.status === "AI_PENDING" && <TypingBubble />}
            {quickReplies && (
              <QuickReplies
                disabled={busy}
                replies={[
                  { label: "To mi pomogło", onClick: () => void setStatus("CLOSED") },
                  { label: "Chcę porozmawiać z zespołem Hubu", onClick: () => void setStatus("WAITING_STAFF") },
                ]}
              />
            )}
            {actionError && <Alert tone="danger">{actionError}</Alert>}
          </>
        }
      />
    </ChatShell>
  );
}
