import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { InnovationTestList } from "@/components/innovation-tests/InnovationTestList";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Publiczna lista otwartych rekrutacji testerów. */
export function InnovationTestsPage() {
  useDocumentTitle("Otwarte testy");
  const { data, error, loading, reload } = useApi(
    () => api.innovationTests({ status: "OPEN", limit: 50, offset: 0 }),
    [],
  );

  return (
    <div className="ds-page max-w-3xl">
      <div className="ds-stack">
        <ModuleLabel module="tester" />
        <h1 tabIndex={-1}>Otwarte testy</h1>
        <p className="m-0 text-body-lg text-ink">
          Wybierz rozwiązanie, które Hub chce sprawdzić z testerami, i wyślij zgłoszenie. Hub odezwie się po
          kwalifikacji.
        </p>
      </div>

      {loading || error ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="Brak otwartych rekrutacji testerów">
          Wróć później — Hub publikuje nowe testy.
        </EmptyState>
      ) : (
        <InnovationTestList items={data?.items ?? []} />
      )}
    </div>
  );
}
