import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { InnovationTestList } from "@/components/innovation-tests/InnovationTestList";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Panel Hubu: lista rekrutacji testerów OPEN/CLOSED. */
export function PanelInnovationTestsPage() {
  useDocumentTitle("Panel: Rekrutacje testerów");
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
    <div className="ds-page">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Rekrutacje testerów</h1>
        <p className="m-0 text-body-lg text-ink">Twórz rekrutacje testerów, akceptuj zgłoszenia i przeglądaj wyniki ankiet.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/panel/testy/nowy" className="ds-btn ds-btn--cta">
            Utwórz rekrutację
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
        <EmptyState title="Brak rekrutacji testerów">
          Utwórz pierwszą rekrutację testerów dla opublikowanego rozwiązania.
        </EmptyState>
      ) : (
        <InnovationTestList
          items={data?.items ?? []}
          linkPrefix="/panel/testy"
          emptyTitle="Brak rekrutacji testerów."
        />
      )}
    </div>
  );
}
