import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { InnovationTestFeedback } from "@/api/types";
import { Alert } from "@/components/Alert";
import { FeedbackForm } from "@/components/innovation-tests/FeedbackForm";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { APPLICATION_STATUS_LABELS } from "@/lib/labels";

/** Dostęp testera po jednorazowym tokenie: status i ankieta. */
export function InnovationTestAccessPage() {
  const { token = "" } = useParams();
  const { data, error, loading, reload } = useApi(
    () => api.innovationTestAccess(token),
    [token],
  );
  const [feedback, setFeedback] = useState<InnovationTestFeedback | null>(null);
  useDocumentTitle(data ? `Status: ${data.test_title}` : "Dostęp testera");

  if (!token) {
    return (
      <div className="ds-page max-w-3xl">
        <Alert tone="danger" title="Brak tokenu.">
          Link dostępu jest niekompletny.
        </Alert>
      </div>
    );
  }

  if (loading || error || !data) {
    return (
      <div className="ds-page max-w-3xl">
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const doneFeedback = feedback ?? data.feedback;
  const completed = data.status === "COMPLETED" || Boolean(doneFeedback);

  return (
    <div className="ds-page max-w-3xl">
      <div className="ds-stack">
        <ModuleLabel module="tester" />
        <h1 tabIndex={-1}>{data.test_title}</h1>
        <p className="m-0 text-body-lg text-ink">
          Status udziału: <strong>{APPLICATION_STATUS_LABELS[data.status]}</strong>
        </p>
      </div>

      {data.status === "REJECTED" && data.rejection_reason && (
        <Alert tone="warning" title="Zgłoszenie odrzucone.">
          {data.rejection_reason}
        </Alert>
      )}
      {data.status === "CANCELED" && data.cancel_reason && (
        <Alert tone="warning" title="Udział anulowany.">
          {data.cancel_reason}
        </Alert>
      )}
      {data.test_status === "CLOSED" && !completed && (
        <Alert tone="warning" title="Rekrutacja testerów zamknięta.">
          Nie można już wysłać ankiety do tego testu.
        </Alert>
      )}

      {completed ? (
        <Alert tone="success" title="Ankieta zapisana.">
          Dziękujemy. Status udziału: {APPLICATION_STATUS_LABELS.COMPLETED}.
        </Alert>
      ) : data.can_submit_feedback ? (
        <section className="ds-stack" aria-labelledby="m4-feedback-heading">
          <h2 id="m4-feedback-heading">Ankieta po teście</h2>
          <p className="m-0 text-body-lg text-ink">Oceń rozwiązanie w skali 1–5. Ankietę można wysłać tylko raz.</p>
          <FeedbackForm token={token} onSubmitted={setFeedback} />
        </section>
      ) : data.status === "SUBMITTED" ? (
        <Alert tone="info" title="Oczekujesz na decyzję Hubu.">
          Gdy Hub zaakceptuje zgłoszenie, otworzysz tę samą stronę i wypełnisz ankietę.
        </Alert>
      ) : null}
    </div>
  );
}
