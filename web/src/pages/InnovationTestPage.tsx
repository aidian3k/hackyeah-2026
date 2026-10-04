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

/** Publiczne szczegóły rekrutacji testerów i formularz zgłoszenia. */
export function InnovationTestPage() {
  const { id } = useParams();
  const testId = Number(id);
  const valid = Number.isFinite(testId) && testId > 0;
  const { data, error, loading, reload } = useApi(
    () => api.innovationTest(testId),
    [testId],
  );
  const [submitted, setSubmitted] = useState<InnovationTestApplicationPublic | null>(null);
  const heading =
    data?.solution_title && /^szukamy\s+tester/i.test(data.title)
      ? data.solution_title
      : (data?.title ?? "Test innowacji");
  useDocumentTitle(heading);

  if (!valid) {
    return (
      <div className="ds-page max-w-3xl">
        <Alert tone="danger" title="Nieprawidłowy adres.">
          Sprawdź link do testu.
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

  const showSolutionBelow =
    Boolean(data.solution_title) && data.solution_title !== heading;

  return (
    <div className="ds-page max-w-3xl">
      <div className="ds-stack">
        <ModuleLabel module="tester" />
        <p>
          <Link to="/testy">Wróć do otwartych testów</Link>
        </p>
        <h1 tabIndex={-1}>{heading}</h1>
        {showSolutionBelow && (
          <p className="m-0 text-body-lg text-ink">
            Rozwiązanie: <Link to={`/rozwiazania/${data.solution_id}`}>{data.solution_title}</Link>
          </p>
        )}
        {!showSolutionBelow && data.solution_title && data.solution_id && (
          <p className="m-0 text-body-lg text-ink">
            <Link to={`/rozwiazania/${data.solution_id}`}>Zobacz kartę rozwiązania</Link>
          </p>
        )}
      </div>

      <dl className="m-0 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Cel testu</dt>
          <dd className="m-0 text-body text-ink">{data.goal_description}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Grupa docelowa</dt>
          <dd className="m-0 text-body text-ink">{data.target_group}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Oczekiwani testerzy</dt>
          <dd className="m-0 text-body text-ink">{data.tester_type}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Lokalizacja</dt>
          <dd className="m-0 text-body text-ink">{data.location}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Tryb</dt>
          <dd className="m-0 text-body text-ink">{TEST_MODE_LABELS[data.mode]}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Czas</dt>
          <dd className="m-0 text-body text-ink">{data.estimated_duration}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Miejsca</dt>
          <dd className="m-0 text-body text-ink">
            {data.seats_accepted}/{data.seats_limit}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="m-0 text-label text-ink-muted">Termin</dt>
          <dd className="m-0 text-body text-ink">{formatDate(data.ends_at)}</dd>
        </div>
      </dl>

      <section className="ds-stack" aria-labelledby="m4-materials-heading">
        <h2 id="m4-materials-heading">Materiały do testu</h2>
        <p className="m-0 text-body-lg text-ink">
          Hub przekaże Ci materiały poza platformą po akceptacji. Poniżej widać, czego dotyczy test.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {data.materials.map((material) => (
            <li key={material.id} className="rounded-md bg-surface-muted p-4">
              <h3 className="mb-2 font-sans text-body font-normal text-navy">
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
