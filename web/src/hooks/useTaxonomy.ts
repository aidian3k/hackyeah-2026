import { useEffect, useMemo, useState } from "react";
import { api, type ApiError } from "@/api/client";
import type { TaxonomyItem } from "@/api/types";
import { toApiError } from "@/hooks/useApi";

// Wspólna obietnica na poziomie modułu: jedno żądanie /api/taxonomy na całą aplikację.
// Po błędzie obietnica jest zapominana, więc następny montowany komponent spróbuje ponownie.
let cache: TaxonomyItem[] | null = null;
let pending: Promise<TaxonomyItem[]> | null = null;

function loadTaxonomy(): Promise<TaxonomyItem[]> {
  if (!pending) {
    pending = api.taxonomy().then(
      (items) => {
        cache = [...items].sort((a, b) => a.sort_order - b.sort_order);
        return cache;
      },
      (err: unknown) => {
        pending = null;
        throw err;
      },
    );
  }
  return pending;
}

export function useTaxonomy(): { items: TaxonomyItem[]; byCode: Map<string, TaxonomyItem>; error: ApiError | null } {
  const [items, setItems] = useState<TaxonomyItem[]>(() => cache ?? []);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (cache) return;
    let active = true;
    loadTaxonomy().then(
      (loaded) => {
        if (active) setItems(loaded);
      },
      (err: unknown) => {
        if (active) setError(toApiError(err));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const byCode = useMemo(() => new Map(items.map((t) => [t.code, t])), [items]);
  return { items, byCode, error };
}
