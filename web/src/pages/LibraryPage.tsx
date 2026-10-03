import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import {
  CatalogFilters,
  readCatalogParams,
  writeCatalogParams,
  type CatalogParams,
} from "@/components/catalog/CatalogFilters";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/styles/catalog.css";

const PAGE_SIZE = 20;

/** Biblioteka innowacji: katalog rozwiązań (kind=SOLUTION) z filtrami w parametrach URL. */
export function LibraryPage() {
  useDocumentTitle("Biblioteka innowacji");
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key to serializacja searchParams
  const params = useMemo(() => readCatalogParams(searchParams), [key]);

  const { data, error, loading, reload } = useApi(
    () =>
      api.solutions({
        kind: "SOLUTION",
        q: params.q || null,
        category: params.category,
        gmina: params.gmina,
        evidence_min: params.evidenceMin,
        sort: params.sort,
        limit: PAGE_SIZE,
        offset: params.offset,
      }),
    [key],
  );

  // Każda zmiana filtra to nowy wpis w historii („Wstecz” przywraca poprzedni stan) i powrót na 1. stronę.
  const changeFilters = useCallback(
    (patch: Partial<Omit<CatalogParams, "offset">>) =>
      setSearchParams((prev) => writeCatalogParams({ ...readCatalogParams(prev), ...patch, offset: 0 })),
    [setSearchParams],
  );
  const changePage = useCallback(
    (offset: number) => setSearchParams((prev) => writeCatalogParams({ ...readCatalogParams(prev), offset })),
    [setSearchParams],
  );
  const clear = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <h1 tabIndex={-1}>Biblioteka innowacji społecznych</h1>
        <p className="catalog-lead">
          Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków i od organizacji z regionu.
        </p>
      </div>
      <div className="catalog-layout">
        <CatalogFilters params={params} onChange={changeFilters} onClear={clear} />
        <CatalogResults
          data={data}
          loading={loading}
          error={error}
          onRetry={reload}
          onPageChange={changePage}
          onClear={clear}
        />
      </div>
    </div>
  );
}
