import { api } from "@/api/client";
import type { SolutionCard } from "@/api/types";
import { useApi, type ApiState } from "@/hooks/useApi";

export const FILM_STRIP_LIMIT = 6;

export interface LibraryFacets {
  total: number;
  withVideo: number;
  /** Tag grupy ROPS → liczba innowacji, malejąco (kolejność z API). */
  groups: { tag: string; count: number }[];
  /** Kod wyzwania → liczba innowacji (tylko > 0). */
  categories: Map<string, number>;
  /** Pierwsze innowacje z filmem do paska „Obejrzyj, jak to działa”. */
  videos: SolutionCard[];
}

/** Liczniki Biblioteki z GET /api/solutions/facets i pierwsze filmy z `has_video=true` (ADR-M2-008). */
export function useLibraryFacets(): ApiState<LibraryFacets> {
  return useApi(async () => {
    const [facets, videos] = await Promise.all([
      api.solutionFacets({ kind: "SOLUTION" }),
      api.solutions({ kind: "SOLUTION", has_video: true, limit: FILM_STRIP_LIMIT }),
    ]);
    return {
      total: facets.total,
      withVideo: facets.with_video,
      groups: facets.groups.map((g) => ({ tag: g.tag, count: g.count })),
      categories: new Map(facets.categories.map((c) => [c.code, c.count])),
      videos: videos.items,
    };
  }, []);
}
