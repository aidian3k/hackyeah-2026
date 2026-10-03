import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import {
  ReportFilters,
  describeReportFilters,
  hasExtraFilters,
  readReportParams,
  writeReportParams,
  type ReportFilterPatch,
} from "@/components/panel/ReportFilters";
import { ReportsTable } from "@/components/panel/ReportsTable";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { plural } from "@/lib/format";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import "@/styles/panel-reports.css";

const PAGE_SIZE = 50;

/** Panel: lista zgłoszeń z filtrami w URL; domyślnie tylko zgłoszenia bez dopasowania. */
export function ReportsPage() {
  useDocumentTitle("Panel: Zgłoszenia");
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key to serializacja searchParams
  const params = useMemo(() => readReportParams(searchParams), [key]);
  const { byCode } = useTaxonomy();

  const { data, error, loading, reload } = useApi(
    () =>
      api.reports({
        matched: params.matched === "all" ? null : params.matched,
        status: params.status,
        category: params.category,
        gmina: params.gmina,
        reporter_type: params.reporterType,
        limit: PAGE_SIZE,
        offset: params.offset,
      }),
    [key],
  );

  // Każda zmiana filtra to nowy wpis w historii i powrót na pierwszą stronę.
  const changeFilters = useCallback(
    (patch: ReportFilterPatch) =>
      setSearchParams((prev) => writeReportParams({ ...readReportParams(prev), ...patch, offset: 0 })),
    [setSearchParams],
  );
  const clear = useCallback(
    () => setSearchParams(writeReportParams(readReportParams(new URLSearchParams()))),
    [setSearchParams],
  );

  const countRef = useRef<HTMLParagraphElement>(null);
  const focusAfterLoad = useRef(false);
  useEffect(() => {
    if (!focusAfterLoad.current || loading || !data) return;
    focusAfterLoad.current = false;
    countRef.current?.scrollIntoView({ block: "start" });
    countRef.current?.focus({ preventScroll: true });
  }, [data, loading]);
  const changePage = (offset: number) => {
    focusAfterLoad.current = true;
    setSearchParams((prev) => writeReportParams({ ...readReportParams(prev), offset }));
  };

  const caption = describeReportFilters(params, (code) => byCode.get(code)?.label_pl ?? code);
  const ready = !loading && !error && data;
  const onlyUnmatchedDefault = params.matched === "false" && !hasExtraFilters(params);

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Zgłoszenia</h1>
        <p className="reports-lead">
          Zgłoszenia bez dopasowania pokazują luki w bazie rozwiązań albo wyzwania, którymi nikt się jeszcze nie
          zajmuje. Dlatego widzisz je jako pierwsze.
        </p>
      </div>
      <div className="reports-layout">
        <ReportFilters params={params} onChange={changeFilters} onClear={clear} />
        <section className="ds-stack reports-results" aria-label="Lista zgłoszeń">
          {/* Region stale w DOM, żeby czytnik ogłosił nową liczbę zgłoszeń. */}
          <p ref={countRef} className="reports-results__count" aria-live="polite" tabIndex={-1}>
            {ready ? `${data.total} ${plural(data.total, "zgłoszenie", "zgłoszenia", "zgłoszeń")}` : ""}
          </p>
          <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy zgłoszenia…">
            {ready && data.total === 0 && onlyUnmatchedDefault && (
              <EmptyState title="Wszystkie zgłoszenia mają dopasowane rozwiązania." />
            )}
            {ready && data.total === 0 && !onlyUnmatchedDefault && (
              <EmptyState title="Żadne zgłoszenie nie pasuje do wybranych filtrów.">
                <p>
                  <button type="button" className="ds-btn" onClick={clear}>
                    Wyczyść filtry
                  </button>
                </p>
              </EmptyState>
            )}
            {ready && data.total > 0 && data.items.length === 0 && (
              <EmptyState title="Na tej stronie nie ma już zgłoszeń.">
                <p>
                  <button type="button" className="ds-btn" onClick={() => changePage(0)}>
                    Przejdź do pierwszej strony
                  </button>
                </p>
              </EmptyState>
            )}
            {ready && data.items.length > 0 && (
              <>
                <ReportsTable items={data.items} caption={caption} />
                <Pagination total={data.total} limit={data.limit} offset={data.offset} onChange={changePage} />
              </>
            )}
          </LoadState>
        </section>
      </div>
    </div>
  );
}
