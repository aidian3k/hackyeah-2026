import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { Page, SolutionCard } from "@/api/types";
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
import { useLibraryOverview } from "@/hooks/useLibraryOverview";
import { useTaxonomy } from "@/hooks/useTaxonomy";

const PAGE_SIZE = 24;
const FILM_STRIP_LIMIT = 6;

/** „Tylko z filmem” liczone po stronie klienta z przeglądu Biblioteki (do czasu filtra has_video w API — Z12). */
function filterVideos(videos: SolutionCard[], p: CatalogParams): Page<SolutionCard> {
  const q = p.q.toLocaleLowerCase("pl");
  const matching = videos.filter(
    (c) =>
      (!p.tag || c.tags.includes(p.tag)) &&
      (!p.category || c.category === p.category) &&
      (!q || `${c.title} ${c.summary}`.toLocaleLowerCase("pl").includes(q)),
  );
  return { items: matching.slice(p.offset, p.offset + PAGE_SIZE), total: matching.length, limit: PAGE_SIZE, offset: p.offset };
}

/** Biblioteka innowacji: grupy ROPS „dla kogo”, filmy na pierwszym planie, filtry w parametrach URL. */
export function LibraryPage() {
  useDocumentTitle("Biblioteka innowacji");
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key to serializacja searchParams
  const params = useMemo(() => readCatalogParams(searchParams), [key]);
  const overview = useLibraryOverview();
  const { items: taxonomy } = useTaxonomy();

  const server = useApi<Page<SolutionCard> | null>(
    () =>
      params.hasVideo
        ? Promise.resolve(null)
        : api.solutions({
            kind: "SOLUTION",
            q: params.q || null,
            tag: params.tag,
            category: params.category,
            limit: PAGE_SIZE,
            offset: params.offset,
          }),
    [key],
  );

  const videoPage = useMemo(
    () => (params.hasVideo && overview.data ? filterVideos(overview.data.videos, params) : null),
    [params, overview.data],
  );
  const results = params.hasVideo
    ? { data: videoPage, loading: !overview.data && !overview.error, error: overview.error }
    : { data: server.data, loading: server.loading, error: server.error };

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

  const stats: HeaderStat[] = overview.data
    ? [
        { value: overview.data.total, label: "innowacji społecznych" },
        { value: overview.data.videos.length, label: "z filmem" },
        { value: overview.data.groups.length, label: "grup odbiorców" },
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
        {overview.data && (
          <GroupChips groups={overview.data.groups} value={params.tag} onChange={(tag) => changeFilters({ tag })} />
        )}
        <CatalogFilters
          params={params}
          categories={taxonomy}
          categoryCounts={overview.data?.categories ?? null}
          withVideo={overview.data?.videos.length ?? null}
          onChange={changeFilters}
          onClear={clear}
        />
      </div>

      {noFilters && overview.data && (
        <FilmStrip
          videos={overview.data.videos}
          limit={FILM_STRIP_LIMIT}
          onShowAll={() => changeFilters({ hasVideo: true })}
        />
      )}

      <CatalogResults
        data={results.data}
        loading={results.loading}
        error={results.error}
        onRetry={server.reload}
        onPageChange={changePage}
        onClear={clear}
      />
    </div>
  );
}
