import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import {
  CatalogFilters,
  CatalogSearch,
  GroupChips,
  activeFilterCount,
  readCatalogParams,
  writeCatalogParams,
  type CatalogParams,
} from "@/components/catalog/CatalogFilters";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilmStrip } from "@/components/catalog/FilmStrip";
import { ZasobnikHeader, type HeaderStat } from "@/components/layout/ZasobnikHeader";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLibraryFacets } from "@/hooks/useLibraryFacets";
import { useTaxonomy } from "@/hooks/useTaxonomy";

const PAGE_SIZE = 24;

/** Biblioteka innowacji: grupy ROPS „dla kogo”, filmy na pierwszym planie, filtry w parametrach URL. */
export function LibraryPage() {
  useDocumentTitle("Biblioteka innowacji");
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key to serializacja searchParams
  const params = useMemo(() => readCatalogParams(searchParams), [key]);
  const facets = useLibraryFacets();
  const { items: taxonomy } = useTaxonomy();

  const results = useApi(
    () =>
      api.solutions({
        kind: "SOLUTION",
        q: params.q || null,
        tag: params.tag,
        category: params.category,
        has_video: params.hasVideo || null,
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
  const changeQuery = useCallback((q: string) => changeFilters({ q }), [changeFilters]);
  const changePage = useCallback(
    (offset: number) => setSearchParams((prev) => writeCatalogParams({ ...readCatalogParams(prev), offset })),
    [setSearchParams],
  );
  const clear = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  const stats: HeaderStat[] = facets.data
    ? [
        { value: facets.data.total, label: "innowacji społecznych" },
        { value: facets.data.withVideo, label: "z filmem" },
        { value: facets.data.groups.length, label: "grup odbiorców" },
      ]
    : [];
  const noFilters = activeFilterCount(params) === 0;

  return (
    <div className="ds-page">
      <ZasobnikHeader
        title="Biblioteka innowacji społecznych"
        lead="Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków — z opisem, materiałami do pobrania, a część z filmem."
        stats={stats}
      />

      <div className="flex flex-col gap-6">
        <CatalogSearch q={params.q} onChange={changeQuery} />
        {facets.data && (
          <GroupChips groups={facets.data.groups} value={params.tag} onChange={(tag) => changeFilters({ tag })} />
        )}
        <CatalogFilters
          params={params}
          categories={taxonomy}
          categoryCounts={facets.data?.categories ?? null}
          withVideo={facets.data?.withVideo ?? null}
          onChange={changeFilters}
          onClear={clear}
        />
      </div>

      {noFilters && facets.data && (
        <FilmStrip
          videos={facets.data.videos}
          total={facets.data.withVideo}
          onShowAll={() => changeFilters({ hasVideo: true })}
        />
      )}

      <CatalogResults
        data={results.data}
        loading={results.loading}
        error={results.error}
        onRetry={results.reload}
        onPageChange={changePage}
        onClear={clear}
      />
    </div>
  );
}
