import { useCallback, useEffect, useState } from "react";
import { commApi } from "@/api/comm";
import { usePolling } from "@/hooks/usePolling";
import { COMM_COUNT_POLL_MS } from "@/lib/comm";

/**
 * Moduł 5: liczba rozmów czekających na zespół Hubu (licznik „Rozmowy” w panelu).
 * `total` z listy z `limit=1`; odpytywanie co 30 s z pauzą na ukrytej karcie. `null` przy błędzie.
 */
export function useCommWaitingCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(() => {
    commApi
      .listThreads({ status: "WAITING_STAFF", limit: 1 })
      .then((page) => setCount(page.total))
      .catch(() => setCount(null));
  }, []);

  useEffect(refresh, [refresh]);
  usePolling(refresh, COMM_COUNT_POLL_MS);
  return count;
}
