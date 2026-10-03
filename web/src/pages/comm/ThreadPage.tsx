import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { commApi } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { MessageForm } from "@/components/comm/MessageForm";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { toApiError } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useThread } from "@/hooks/useThread";
import { loginHref, useAuth } from "@/lib/auth";
import { rememberThread, THREAD_KIND_LABELS } from "@/lib/comm";

/** Moduł 5: rozmowa widziana przez autora (publiczna po id; pisanie — rola reporter). */
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

  return (
    <div className="ds-page max-w-3xl">
      <p className="m-0">
        <Link to="/rozmowy">Platforma komunikacji</Link> › Rozmowa
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
                <ThreadStatus status={d.status} viewer="author" />
                {d.partnership_id !== null && <Link to={`/partnerzy/${d.partnership_id}`}>Zobacz ogłoszenie</Link>}
              </p>
            </header>

            <p className="ds-sr-only" aria-live="polite">
              {thread.announcement}
            </p>

            <Timeline messages={d.messages} viewer="author" />

            {d.status === "AI_PENDING" && (
              <p role="status" className="m-0 flex items-center gap-3">
                <span className="ds-spinner" aria-hidden="true" />
                Asystent szuka odpowiedzi w Bibliotece Innowacji…
              </p>
            )}

            {actionError && <Alert tone="danger">{actionError}</Alert>}

            {canWrite && d.status === "WAITING_USER" && lastRole === "ASSISTANT" && (
              <section aria-label="Czy to pomogło?" className="flex flex-wrap gap-3">
                <button type="button" className="ds-btn" disabled={busy} onClick={() => void setStatus("CLOSED")}>
                  To mi pomogło
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn--primary"
                  disabled={busy}
                  onClick={() => void setStatus("WAITING_STAFF")}
                >
                  Chcę porozmawiać z zespołem Hubu
                </button>
              </section>
            )}

            {d.status !== "AI_PENDING" &&
              (canWrite ? (
                <MessageForm
                  label={d.status === "CLOSED" ? "Napisz, aby otworzyć rozmowę ponownie" : "Odpowiedz"}
                  submitLabel="Wyślij"
                  onSend={reply}
                />
              ) : (
                <p className="m-0">
                  <Link className="ds-btn ds-btn--primary" to={loginHref(pathname + search)}>
                    Zaloguj się, aby odpowiedzieć
                  </Link>
                </p>
              ))}
          </>
        )}
      </LoadState>
    </div>
  );
}
