import { useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import type { ApplicationStatus, InnovationTestAccessLink, InnovationTestReport } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError, useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  TEST_MODE_LABELS,
  TEST_STATUS_LABELS,
  TESTER_TYPE_LABELS,
} from "@/lib/labels";
import "@/styles/innovation-tests.css";

/** Panel Hubu: zarządzanie naborem, decyzje, link, raport i moderacja. */
export function PanelInnovationTestManagePage() {
  const { id } = useParams();
  const testId = Number(id);
  const valid = Number.isFinite(testId) && testId > 0;
  const reasonId = useId();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [lastLink, setLastLink] = useState<InnovationTestAccessLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<InnovationTestReport | null>(null);

  const testState = useApi(() => api.innovationTest(testId, { hub: true }), [testId]);
  const appsState = useApi(
    () =>
      api.innovationTestApplications(testId, {
        status: statusFilter || null,
        limit: 100,
        offset: 0,
      }),
    [testId, statusFilter],
  );

  useDocumentTitle(testState.data?.title ?? "Panel: Nabór");

  async function runAction(fn: () => Promise<void>) {
    setActionError(null);
    try {
      await fn();
      appsState.reload();
      testState.reload();
    } catch (err) {
      setActionError(toApiError(err));
    }
  }

  if (!valid) {
    return (
      <div className="ds-page">
        <Alert tone="danger" title="Nieprawidłowy adres." />
      </div>
    );
  }

  if (testState.loading || testState.error || !testState.data) {
    return (
      <div className="ds-page">
        <LoadState loading={testState.loading} error={testState.error} onRetry={testState.reload} />
      </div>
    );
  }

  const test = testState.data;
  const accessUrl = lastLink
    ? `${window.location.origin}/testy/dostep/${lastLink.access_token}`
    : null;

  return (
    <div className="ds-page m4-page--wide">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <p>
          <Link to="/panel/testy">Wróć do naborów</Link>
        </p>
        <h1 tabIndex={-1}>{test.title}</h1>
        <p className="m4-lead">
          {TEST_STATUS_LABELS[test.status]} · {TEST_MODE_LABELS[test.mode]} · miejsca{" "}
          {test.seats_accepted}/{test.seats_limit} · do {formatDate(test.ends_at)}
        </p>
      </div>

      {actionError && (
        <Alert tone="danger" title="Operacja nie powiodła się.">
          {actionError.message}
        </Alert>
      )}

      <div className="m4-form__actions">
        {test.status === "OPEN" && (
          <button
            type="button"
            className="ds-btn"
            onClick={() =>
              runAction(async () => {
                await api.closeInnovationTest(testId);
              })
            }
          >
            Zamknij nabór
          </button>
        )}
        <button
          type="button"
          className="ds-btn"
          onClick={() =>
            runAction(async () => {
              setReport(await api.innovationTestReport(testId));
            })
          }
        >
          Pokaż raport
        </button>
        <button
          type="button"
          className="ds-btn"
          onClick={() =>
            runAction(async () => {
              setReport(await api.regenerateInnovationTestReport(testId));
            })
          }
        >
          Regeneruj raport AI
        </button>
      </div>

      {lastLink && accessUrl && (
        <Alert tone="success" title="Link dla testera.">
          <p>
            Skopiuj i przekaż ręcznie: <code>{accessUrl}</code>
          </p>
          <button
            type="button"
            className="ds-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(accessUrl);
              setCopied(true);
            }}
          >
            {copied ? "Skopiowano" : "Kopiuj link"}
          </button>
        </Alert>
      )}

      <section className="ds-stack" aria-labelledby="m4-apps-heading">
        <h2 id="m4-apps-heading">Zgłoszenia</h2>
        <div className="ds-field">
          <label htmlFor={`${reasonId}-status`}>Filtr statusu</label>
          <select
            id={`${reasonId}-status`}
            className="ds-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
          >
            <option value="">Wszystkie</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label htmlFor={`${reasonId}-reason`}>Powód odrzucenia / anulowania</label>
          <input
            id={`${reasonId}-reason`}
            className="ds-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Wymagany przy odrzuceniu i anulowaniu"
          />
        </div>

        {appsState.loading || appsState.error ? (
          <LoadState loading={appsState.loading} error={appsState.error} onRetry={appsState.reload} />
        ) : (
          <div className="m4-table-wrap">
            <table className="m4-table">
              <thead>
                <tr>
                  <th>Osoba</th>
                  <th>Kontakt</th>
                  <th>Status</th>
                  <th>Sugestia AI</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {(appsState.data?.items ?? []).map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.display_name}</strong>
                      <br />
                      {TESTER_TYPE_LABELS[app.tester_type]}
                      <br />
                      {app.gmina}, {app.powiat}
                    </td>
                    <td>{app.email}</td>
                    <td>{APPLICATION_STATUS_LABELS[app.status]}</td>
                    <td>
                      {app.ai_fit_suggestion ? (
                        <>
                          <strong>{app.ai_fit_suggestion.label_pl}</strong>
                          <br />
                          {app.ai_fit_suggestion.rationale_pl}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="m4-inline-actions">
                        {app.status === "SUBMITTED" && (
                          <>
                            <button
                              type="button"
                              className="ds-btn ds-btn--cta"
                              onClick={() =>
                                runAction(async () => {
                                  const link = await api.acceptInnovationApplication(testId, app.id);
                                  setLastLink(link);
                                  setCopied(false);
                                })
                              }
                            >
                              Akceptuj
                            </button>
                            <button
                              type="button"
                              className="ds-btn"
                              onClick={() =>
                                runAction(async () => {
                                  if (!reason.trim()) {
                                    throw new ApiError(
                                      422,
                                      "VALIDATION_ERROR",
                                      "Podaj powód odrzucenia.",
                                    );
                                  }
                                  await api.rejectInnovationApplication(testId, app.id, reason.trim());
                                })
                              }
                            >
                              Odrzuć
                            </button>
                          </>
                        )}
                        {(app.status === "SUBMITTED" || app.status === "ACCEPTED") && (
                          <button
                            type="button"
                            className="ds-btn"
                            onClick={() =>
                              runAction(async () => {
                                if (!reason.trim()) {
                                  throw new ApiError(
                                    422,
                                    "VALIDATION_ERROR",
                                    "Podaj powód anulowania.",
                                  );
                                }
                                await api.cancelInnovationApplication(
                                  testId,
                                  app.id,
                                  reason.trim(),
                                );
                              })
                            }
                          >
                            Anuluj
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {report && (
        <section className="ds-stack" aria-labelledby="m4-report-heading">
          <h2 id="m4-report-heading">Raport wyników</h2>
          {report.small_sample_warning && (
            <Alert tone="warning" title="Mała próba.">
              Zebrano mniej niż 3 ankiety — wyniki traktuj ostrożnie.
            </Alert>
          )}
          <div className="m4-stats">
            <div className="m4-stats__card">
              <h3>Zgłoszenia</h3>
              <p>łącznie {report.applications_total}</p>
              <p>zaakceptowane {report.applications_accepted}</p>
              <p>ukończone {report.applications_completed}</p>
              <p>odrzucone {report.applications_rejected}</p>
              <p>anulowane {report.applications_canceled}</p>
            </div>
            <div className="m4-stats__card">
              <h3>Średnie ocen</h3>
              <p>przydatność {report.usefulness.average ?? "—"}</p>
              <p>łatwość użycia {report.ease_of_use.average ?? "—"}</p>
              <p>dostępność {report.accessibility.average ?? "—"}</p>
              <p>dopasowanie {report.fit_to_needs.average ?? "—"}</p>
            </div>
          </div>

          {report.ai_available && report.ai_report ? (
            <div className="ds-stack">
              <h3>Podsumowanie AI</h3>
              <p>{report.ai_report.summary_pl}</p>
              <p className="m4-list__meta">{report.ai_report.disclaimer_pl}</p>
              {report.ai_generated_at && (
                <p className="m4-list__meta">
                  Wygenerowano {formatDateTime(report.ai_generated_at)}
                  {report.ai_model ? ` · ${report.ai_model}` : ""}
                </p>
              )}
            </div>
          ) : (
            <Alert tone="info" title="Brak raportu AI.">
              {report.ai_error_pl ?? "Statystyki i komentarze są dostępne bez AI."}
            </Alert>
          )}

          <h3>Komentarze do moderacji</h3>
          <div className="ds-stack">
            {report.anonymous_comments.length === 0 && <p>Brak komentarzy.</p>}
            {report.anonymous_comments.map((item) => (
              <article key={item.feedback_id} className="m4-comment">
                <p>
                  <strong>#{item.feedback_id}</strong> · widoczny dla autora:{" "}
                  {item.comment_visible_to_author ? "tak" : "nie"}
                </p>
                {item.comment && <p>{item.comment}</p>}
                {item.improvement && <p>Usprawnienie: {item.improvement}</p>}
                <div className="m4-inline-actions">
                  <button
                    type="button"
                    className="ds-btn"
                    onClick={() =>
                      runAction(async () => {
                        await api.moderateInnovationFeedback(
                          testId,
                          item.feedback_id,
                          !item.comment_visible_to_author,
                        );
                        setReport(await api.innovationTestReport(testId));
                      })
                    }
                  >
                    {item.comment_visible_to_author ? "Ukryj przed autorem" : "Pokaż autorowi"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
