import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { InnovationTestList } from "@/components/innovation-tests/InnovationTestList";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/styles/innovation-tests.css";

/** Panel Hubu: lista naborów OPEN/CLOSED. */
export function PanelInnovationTestsPage() {
  useDocumentTitle("Panel: Nabory testerów");
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status");
  const queryStatus = status === "OPEN" || status === "CLOSED" ? status : undefined;
  const { data, error, loading, reload } = useApi(
    () =>
      api.innovationTests({
        hub: true,
        status: queryStatus,
        limit: 50,
        offset: 0,
      }),
    [queryStatus ?? "all"],
  );

  return (
    <div className="ds-page m4-page--wide">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Nabory testerów</h1>
        <p className="m4-lead">Twórz nabory, akceptuj testerów i przeglądaj wyniki ankiet.</p>
        <div className="m4-form__actions">
          <Link to="/panel/testy/nowy" className="ds-btn ds-btn--cta">
            Utwórz nabór
          </Link>
          <button
            type="button"
            className="ds-btn"
            onClick={() => setSearchParams({})}
            aria-pressed={!queryStatus}
          >
            Wszystkie
          </button>
          <button
            type="button"
            className="ds-btn"
            onClick={() => setSearchParams({ status: "OPEN" })}
            aria-pressed={queryStatus === "OPEN"}
          >
            Otwarte
          </button>
          <button
            type="button"
            className="ds-btn"
            onClick={() => setSearchParams({ status: "CLOSED" })}
            aria-pressed={queryStatus === "CLOSED"}
          >
            Zamknięte
          </button>
        </div>
      </div>

      {loading || error ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="Brak naborów">
          Utwórz pierwszy nabór dla opublikowanego rozwiązania.
        </EmptyState>
      ) : (
        <InnovationTestList
          items={data?.items ?? []}
          linkPrefix="/panel/testy"
          emptyTitle="Brak naborów."
        />
      )}
    </div>
  );
}
