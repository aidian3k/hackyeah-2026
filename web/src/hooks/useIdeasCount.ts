import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { INBOX_POLL_MS } from "@/hooks/useInboxCount";
import { usePolling } from "@/hooks/usePolling";

/**
 * Licznik przy „Pomysły” w nawigacji panelu: liczba pomysłów w statusie SUBMITTED
 * (`total` z GET /api/ideas?status=SUBMITTED&limit=1). Odświeżanie jak useInboxCount:
 * przy montowaniu i co 30 s, z pauzą na ukrytej karcie. null przy błędzie i przed pierwszą odpowiedzią.
 */
export function useIdeasCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    api.ideas({ status: "SUBMITTED", limit: 1 }).then(
      (page) => {
        if (active) setCount(page.total);
      },
      () => {
        if (active) setCount(null);
      },
    );
    return () => {
      active = false;
    };
  }, [tick]);

  usePolling(() => setTick((t) => t + 1), INBOX_POLL_MS);
  return count;
}
