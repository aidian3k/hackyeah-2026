import { useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { commApi, type ThreadDetail } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { ChatComposer } from "@/components/comm/ChatComposer";
import { ChatShell } from "@/components/comm/ChatShell";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { TypingBubble } from "@/components/comm/TypingBubble";
import { LoadState } from "@/components/LoadState";
import { toApiError, useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useThread } from "@/hooks/useThread";
import { THREAD_KIND_LABELS } from "@/lib/comm";
import { REPORTER_TYPE_LABELS } from "@/lib/labels";

const DEFAULT_SIGNATURE = "Zespół Hubu";

/** Przydział eksperta: lista z ekspertami z tego samego obszaru na górze. */
function MentorAssign({ thread, onChanged }: { thread: ThreadDetail; onChanged(): Promise<void> }) {
  const selectId = useId();
  const mentors = useApi(() => commApi.mentors(thread.category), [thread.category]);
  const [choice, setChoice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function assign(mentorId: number | null) {
    setBusy(true);
    setError(null);
    try {
      await commApi.patchThread(thread.id, { assigned_mentor_id: mentorId });
      setStatus(mentorId === null ? "Usunięto przydział eksperta." : "Przydzielono eksperta.");
      setChoice("");
      await onChanged();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`${selectId}-h`} className="flex flex-col gap-3">
      <h2 id={`${selectId}-h`} className="m-0 text-h3">
        Ekspert
      </h2>
      <p className="m-0">
        {thread.assigned_mentor ? `Przydzielony: ${thread.assigned_mentor.display_name}.` : "Nikt nie jest przydzielony."}
      </p>
      <LoadState loading={mentors.loading} error={mentors.error} onRetry={mentors.reload}>
        {mentors.data && (
          <div className="flex flex-col gap-3">
            <div className="ds-field">
              <label className="ds-label" htmlFor={selectId}>
                Wybierz eksperta
              </label>
              <select id={selectId} className="ds-select" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">—</option>
                {mentors.data.map((m) => {
                  const match = thread.category !== null && m.categories.includes(thread.category);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                      {match ? " — ten sam obszar" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="m-0 flex flex-wrap gap-3">
              <button type="button" className="ds-btn" disabled={busy || !choice} onClick={() => void assign(Number(choice))}>
                Przydziel
              </button>
              {thread.assigned_mentor && (
                <button type="button" className="ds-btn ds-btn--link" disabled={busy} onClick={() => void assign(null)}>
                  Usuń przydział
                </button>
              )}
            </p>
          </div>
        )}
      </LoadState>
      {error && <Alert tone="danger">{error}</Alert>}
      <p className="ds-sr-only" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

/** Moduł 5 — panel: rozmowa jak w komunikatorze + kolumna z podpisem, statusem i ekspertem. */
export function CommThreadPage() {
  const id = Number(useParams().id);
  const thread = useThread(id, { viewer: "staff" });
  const signatureId = useId();
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(thread.data?.subject ?? "Rozmowa");
  const d = thread.data;

  async function reply(body: string) {
    await commApi.addMessage(id, { role: "STAFF", body, author_label: signature.trim() || null });
    await thread.refresh();
  }

  async function setStatus(status: "WAITING_STAFF" | "CLOSED") {
    setBusy(true);
    setError(null);
    try {
      await commApi.patchThread(id, { status });
      await thread.refresh();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  if (!d) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <LoadState loading={thread.loading} error={thread.error} onRetry={() => void thread.refresh()} />
      </div>
    );
  }

  const closed = d.status === "CLOSED";

  return (
    <ChatShell
      back={{ to: "/panel/rozmowy", label: "Rozmowy" }}
      title={d.subject}
      announcement={thread.announcement}
      meta={
        <>
          <span>{THREAD_KIND_LABELS[d.kind]}</span>
          <ThreadStatus status={d.status} viewer="staff" />
          {d.category_label_pl && <span>{d.category_label_pl}</span>}
          <span>Pisze: {REPORTER_TYPE_LABELS[d.reporter_type]}</span>
          {d.partnership_id !== null && <Link to={`/partnerzy/${d.partnership_id}`}>Ogłoszenie</Link>}
        </>
      }
      footer={
        closed ? (
          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-0 border-t border-solid border-line bg-surface px-4 py-3">
            <span className="text-ink-muted">Rozmowa jest zamknięta.</span>
            <button type="button" className="ds-btn" disabled={busy} onClick={() => void setStatus("WAITING_STAFF")}>
              Otwórz ponownie
            </button>
          </div>
        ) : (
          <ChatComposer label="Odpowiedź Hubu" placeholder="Napisz odpowiedź do autora…" onSend={reply} />
        )
      }
      aside={
        <>
          <section aria-labelledby="chat-actions" className="flex flex-col gap-3">
            <h2 id="chat-actions" className="m-0 text-h3">
              Rozmowa
            </h2>
            <div className="ds-field">
              <label className="ds-label" htmlFor={signatureId}>
                Podpis odpowiedzi
              </label>
              <input
                id={signatureId}
                className="ds-input"
                maxLength={100}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>
            {!closed && d.status !== "AI_PENDING" && (
              <p className="m-0">
                <button type="button" className="ds-btn" disabled={busy} onClick={() => void setStatus("CLOSED")}>
                  Zamknij rozmowę
                </button>
              </p>
            )}
            {error && <Alert tone="danger">{error}</Alert>}
          </section>
          <MentorAssign thread={d} onChanged={thread.refresh} />
        </>
      }
    >
      <Timeline
        messages={d.messages}
        viewer="staff"
        scrollKey={d.status}
        after={d.status === "AI_PENDING" ? <TypingBubble /> : undefined}
      />
    </ChatShell>
  );
}
