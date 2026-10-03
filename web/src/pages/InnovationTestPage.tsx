import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { InnovationTestApplicationPublic } from "@/api/types";
import { Alert } from "@/components/Alert";
import { ApplicationForm } from "@/components/innovation-tests/ApplicationForm";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate } from "@/lib/format";
import { MATERIAL_TYPE_LABELS, TEST_MODE_LABELS } from "@/lib/labels";
import "@/styles/innovation-tests.css";

/** Publiczne szczegóły naboru i formularz zgłoszenia. */
export function InnovationTestPage() {
  const { id } = useParams();
  const testId = Number(id);
  const valid = Number.isFinite(testId) && testId > 0;
  const { data, error, loading, reload } = useApi(
    () => api.innovationTest(testId),
    [testId],
  );
  const [submitted, setSubmitted] = useState<InnovationTestApplicationPublic | null>(null);
  useDocumentTitle(data?.title ?? "Nabór testerów");

  if (!valid) {
    return (
      <div className="ds-page m4-page">
        <Alert tone="danger" title="Nieprawidłowy adres.">
          Sprawdź link do naboru.
        </Alert>
      </div>
    );
  }

  if (loading || error || !data) {
    return (
      <div className="ds-page m4-page">
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="ds-page m4-page">
      <div className="ds-stack">
        <ModuleLabel module="tester" />
        <p>
          <Link to="/testy">Wróć do listy naborów</Link>
        </p>
        <h1 tabIndex={-1}>{data.title}</h1>
        {data.solution_title && (
          <p className="m4-lead">
            Rozwiązanie: <Link to={`/rozwiazania/${data.solution_id}`}>{data.solution_title}</Link>
          </p>
        )}
      </div>

      <dl className="m4-meta-grid">
        <div>
          <dt>Cel testu</dt>
          <dd>{data.goal_description}</dd>
        </div>
        <div>
          <dt>Grupa docelowa</dt>
          <dd>{data.target_group}</dd>
        </div>
        <div>
          <dt>Oczekiwani testerzy</dt>
          <dd>{data.tester_type}</dd>
        </div>
        <div>
          <dt>Lokalizacja</dt>
          <dd>{data.location}</dd>
        </div>
        <div>
          <dt>Tryb</dt>
          <dd>{TEST_MODE_LABELS[data.mode]}</dd>
        </div>
        <div>
          <dt>Czas</dt>
          <dd>{data.estimated_duration}</dd>
        </div>
        <div>
          <dt>Miejsca</dt>
          <dd>
            {data.seats_accepted}/{data.seats_limit}
          </dd>
        </div>
        <div>
          <dt>Termin</dt>
          <dd>{formatDate(data.ends_at)}</dd>
        </div>
      </dl>

      <section className="ds-stack" aria-labelledby="m4-materials-heading">
        <h2 id="m4-materials-heading">Materiały do testu</h2>
        <p className="m4-lead">
          Hub przekaże Ci materiały poza platformą po akceptacji. Poniżej widać, czego dotyczy nabór.
        </p>
        <ul className="m4-materials">
          {data.materials.map((material) => (
            <li key={material.id}>
              <h3>
                {material.title} · {MATERIAL_TYPE_LABELS[material.type]}
              </h3>
              {material.description && <p>{material.description}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="ds-stack" aria-labelledby="m4-apply-heading">
        <h2 id="m4-apply-heading">Zgłoś udział</h2>
        {submitted ? (
          <Alert tone="success" title="Wysłano.">
            {submitted.message_pl}
          </Alert>
        ) : (
          <ApplicationForm testId={data.id} onSubmitted={setSubmitted} />
        )}
      </section>
    </div>
  );
}
