import { useEffect, useState } from "react";
import { api, type ApiError } from "@/api/client";
import type { GminaItem } from "@/api/types";
import { toApiError } from "@/hooks/useApi";

// Wspólna obietnica na poziomie modułu: jedno żądanie /api/gminy na całą aplikację.
let cache: GminaItem[] | null = null;
let pending: Promise<GminaItem[]> | null = null;

function loadGminy(): Promise<GminaItem[]> {
  if (!pending) {
    pending = api.gminy().then(
      (items) => {
        cache = items;
        return items;
      },
      (err: unknown) => {
        pending = null;
        throw err;
      },
    );
  }
  return pending;
}

export function useGminy(): { items: GminaItem[]; error: ApiError | null } {
  const [items, setItems] = useState<GminaItem[]>(() => cache ?? []);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (cache) return;
    let active = true;
    loadGminy().then(
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

  return { items, error };
}
