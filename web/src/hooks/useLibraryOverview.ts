import { useEffect, useState } from "react";
import { api, type ApiError } from "@/api/client";
import type { SolutionCard } from "@/api/types";
import { toApiError } from "@/hooks/useApi";
import { firstVideo } from "@/lib/media";
import { ROPS_GROUP_PREFIX } from "@/lib/ropsGroups";

/** Maksimum `limit` w GET /api/solutions. */
const API_PAGE = 100;

export interface LibraryOverview {
  items: SolutionCard[];
  total: number;
  videos: SolutionCard[];
  /** Tag grupy ROPS → liczba innowacji, malejąco. */
  groups: { tag: string; count: number }[];
  /** Kod wyzwania → liczba innowacji. */
  categories: Map<string, number>;
}

/**
 * Przegląd całej Biblioteki (opublikowane SOLUTION) do liczników, chipów i paska filmów.
 * Tymczasowo po stronie klienta: Biblioteka ma ~115 pozycji (2 żądania). Docelowo zastąpi to
 * GET /api/solutions/facets i filtr has_video (zadanie Z12, ADR-M2-008).
 */
let cache: LibraryOverview | null = null;
let pending: Promise<LibraryOverview> | null = null;

async function fetchAll(): Promise<SolutionCard[]> {
  const first = await api.solutions({ kind: "SOLUTION", limit: API_PAGE, offset: 0 });
  const items = [...first.items];
  const rest: Promise<{ items: SolutionCard[] }>[] = [];
  for (let offset = API_PAGE; offset < first.total; offset += API_PAGE) {
    rest.push(api.solutions({ kind: "SOLUTION", limit: API_PAGE, offset }));
  }
  for (const page of await Promise.all(rest)) items.push(...page.items);
  return items;
}

function summarize(items: SolutionCard[]): LibraryOverview {
  const groups = new Map<string, number>();
  const categories = new Map<string, number>();
  for (const card of items) {
    const tag = card.tags.find((t) => t.startsWith(ROPS_GROUP_PREFIX));
    if (tag) groups.set(tag, (groups.get(tag) ?? 0) + 1);
    if (card.category) categories.set(card.category, (categories.get(card.category) ?? 0) + 1);
  }
  return {
    items,
    total: items.length,
    videos: items.filter((c) => firstVideo(c.media) !== null),
    groups: [...groups.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "pl")),
    categories,
  };
}

function load(): Promise<LibraryOverview> {
  if (!pending) {
    pending = fetchAll().then(
      (items) => (cache = summarize(items)),
      (err: unknown) => {
        pending = null;
        throw err;
      },
    );
  }
  return pending;
}

export function useLibraryOverview(): { data: LibraryOverview | null; error: ApiError | null } {
  const [data, setData] = useState<LibraryOverview | null>(cache);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load().then(
      (d) => alive && setData(d),
      (e: unknown) => alive && setError(toApiError(e)),
    );
    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}
