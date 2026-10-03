import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/api/client";
import { commApi, type ThreadDetail } from "@/api/comm";
import { toApiError } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import { AI_POLL_MS, messageRoleLabel, THREAD_POLL_MS, type Viewer } from "@/lib/comm";

interface Options {
  viewer: Viewer;
  /** Autor: po wczytaniu nowej odpowiedzi oznacz rozmowę jako przeczytaną. */
  markRead?: boolean;
}

export interface ThreadState {
  data: ThreadDetail | null;
  error: ApiError | null;
  loading: boolean;
  /** Komunikat dla czytnika ekranu o nowej wiadomości (do regionu aria-live). */
  announcement: string;
  refresh(): Promise<void>;
}

/**
 * Rozmowa z odpytywaniem: co 2 s, gdy asystent szuka odpowiedzi, inaczej co 5 s
 * (pauza na ukrytej karcie). Błąd odświeżenia w tle nie kasuje wczytanych danych.
 */
export function useThread(id: number, { viewer, markRead = false }: Options): ThreadState {
  const [data, setData] = useState<ThreadDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const seen = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await commApi.getThread(id);
      const prev = seen.current;
      if (prev !== null && d.messages.length > prev) {
        const last = d.messages[d.messages.length - 1];
        if (last) setAnnouncement(`Nowa wiadomość: ${messageRoleLabel(last, viewer)}.`);
      }
      seen.current = d.messages.length;
      setData(d);
      setError(null);
      if (markRead && d.has_reply) void commApi.markRead(id).catch(() => undefined);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, viewer, markRead]);

  useEffect(() => {
    seen.current = null;
    setData(null);
    setLoading(true);
    setAnnouncement("");
    void load();
  }, [load]);

  usePolling(() => void load(), data?.status === "AI_PENDING" ? AI_POLL_MS : THREAD_POLL_MS);

  return { data, error, loading, announcement, refresh: load };
}
