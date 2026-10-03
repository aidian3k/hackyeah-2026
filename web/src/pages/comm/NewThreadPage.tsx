import { useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { commApi } from "@/api/comm";
import type { ReporterType } from "@/api/types";
import { ReporterTypeField } from "@/components/chat/ReporterTypeField";
import { MessageForm } from "@/components/comm/MessageForm";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { rememberThread } from "@/lib/comm";
import { PRIVACY_WARNING } from "@/lib/labels";
import { getSessionId } from "@/lib/storage";

/** Moduł 5: nowe pytanie do Hubu albo prośba o eksperta (`?rodzaj=ekspert`). */
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
    <div className="ds-page max-w-3xl">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          {title}
        </h1>
        <p className="m-0 text-body-lg">
          {mentoring
            ? "Opisz, w czym potrzebujesz wsparcia. Zespół Hubu dobierze eksperta z tej dziedziny i odpowie w rozmowie."
            : "Asystent od razu poszuka odpowiedzi w Bibliotece Innowacji. Jeśli to nie wystarczy, rozmowę przejmie zespół Hubu."}
        </p>
      </header>

      <MessageForm
        label={mentoring ? "W czym potrzebujesz wsparcia eksperta?" : "Twoje pytanie"}
        submitLabel={mentoring ? "Wyślij prośbę" : "Wyślij pytanie"}
        hint={PRIVACY_WARNING}
        rows={6}
        onSend={send}
        extra={
          <>
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
          </>
        }
      />

      <p className="m-0">
        <Link to="/rozmowy" className="ds-btn ds-btn--link px-0">
          Wróć do Platformy komunikacji
        </Link>
      </p>
    </div>
  );
}
