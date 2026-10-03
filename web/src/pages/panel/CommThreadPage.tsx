import { useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { commApi, type ThreadDetail } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { MessageForm } from "@/components/comm/MessageForm";
import { ThreadStatus } from "@/components/comm/ThreadStatus";
import { Timeline } from "@/components/comm/Timeline";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
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
      <h2 id={`${selectId}-h`} className="m-0">
        Ekspert
      </h2>
      <p className="m-0">
        {thread.assigned_mentor ? `Przydzielony: ${thread.assigned_mentor.display_name}.` : "Nikt nie jest przydzielony."}
      </p>
      <LoadState loading={mentors.loading} error={mentors.error} onRetry={mentors.reload}>
        {mentors.data && (
          <div className="flex flex-wrap items-end gap-3">
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
                      {m.organization ? `, ${m.organization}` : ""}
                      {match ? " — ten sam obszar" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <button type="button" className="ds-btn" disabled={busy || !choice} onClick={() => void assign(Number(choice))}>
              Przydziel
            </button>
            {thread.assigned_mentor && (
              <button type="button" className="ds-btn ds-btn--link" disabled={busy} onClick={() => void assign(null)}>
                Usuń przydział
              </button>
            )}
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

/** Moduł 5 — panel: rozmowa, odpowiedź Hubu, zamknięcie i przydział eksperta. */
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

  return (
    <div className="ds-page max-w-3xl">
      <p className="m-0">
        <Link to="/panel/rozmowy">Rozmowy</Link> › Rozmowa nr {id}
      </p>
      <LoadState loading={thread.loading && !d} error={d ? null : thread.error} onRetry={() => void thread.refresh()}>
        {d && (
          <>
            <header className="flex flex-col gap-3">
              <ModuleLabel module="panel" />
              <h1 tabIndex={-1} className="m-0 [overflow-wrap:anywhere]">
                {d.subject}
              </h1>
              <ul className="ds-meta m-0">
                <li className="ds-meta__item">{THREAD_KIND_LABELS[d.kind]}</li>
                <li className="ds-meta__item">
                  <ThreadStatus status={d.status} viewer="staff" />
                </li>
                {d.category_label_pl && <li className="ds-meta__item">{d.category_label_pl}</li>}
                <li className="ds-meta__item">Pisze: {REPORTER_TYPE_LABELS[d.reporter_type]}</li>
                {d.partnership_id !== null && (
                  <li className="ds-meta__item">
                    <Link to={`/partnerzy/${d.partnership_id}`}>Ogłoszenie, którego dotyczy</Link>
                  </li>
                )}
              </ul>
            </header>

            <p className="ds-sr-only" aria-live="polite">
              {thread.announcement}
            </p>
            <Timeline messages={d.messages} viewer="staff" />

            {d.status === "CLOSED" ? (
              <p className="m-0">
                <button type="button" className="ds-btn" disabled={busy} onClick={() => void setStatus("WAITING_STAFF")}>
                  Otwórz ponownie
                </button>
              </p>
            ) : (
              <>
                <MessageForm
                  label="Odpowiedź Hubu"
                  submitLabel="Wyślij odpowiedź"
                  onSend={reply}
                  extra={
                    <div className="ds-field">
                      <label className="ds-label" htmlFor={signatureId}>
                        Podpis
                      </label>
                      <input
                        id={signatureId}
                        className="ds-input max-w-lg"
                        maxLength={100}
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                      />
                    </div>
                  }
                />
                {d.status !== "AI_PENDING" && (
                  <p className="m-0">
                    <button type="button" className="ds-btn" disabled={busy} onClick={() => void setStatus("CLOSED")}>
                      Zamknij rozmowę
                    </button>
                  </p>
                )}
              </>
            )}
            {error && <Alert tone="danger">{error}</Alert>}

            <MentorAssign thread={d} onChanged={thread.refresh} />
          </>
        )}
      </LoadState>
    </div>
  );
}
