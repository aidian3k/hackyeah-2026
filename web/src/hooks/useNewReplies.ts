import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { usePolling } from "@/hooks/usePolling";
import { listMyIdeas, MY_IDEAS_EVENT } from "@/lib/storage";

/** Co ile sprawdzamy nowe odpowiedzi Hubu do pomysłów z tej przeglądarki. */
export const NEW_REPLIES_POLL_MS = 30_000;
/** Odpowiedź młodsza niż ten próg wystarcza (MainNav i KreatorNav robią razem jedno odpytanie). */
const FRESH_MS = NEW_REPLIES_POLL_MS * 0.9;

// Wspólny stan modułu: reply_count z API per pomysł, bez względu na liczbę odbiorców.
let replyCounts: Record<number, number> = {};
let updatedAt: number | null = null;
let inflight: Promise<void> | null = null;
let unseen = 0;
const listeners = new Set<() => void>();

/** Liczba pomysłów z tej przeglądarki, które mają odpowiedzi nieoznaczone jako przeczytane. */
function computeUnseen(): number {
  return listMyIdeas().filter((x) => (replyCounts[x.idea_id] ?? 0) > x.seen_replies).length;
}

function recompute() {
  const next = computeUnseen();
  if (next === unseen) return;
  unseen = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener(MY_IDEAS_EVENT, recompute);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener(MY_IDEAS_EVENT, recompute);
  };
}

function getSnapshot() {
  return unseen;
}

/** Pobiera reply_count każdego zapamiętanego pomysłu (GET /api/ideas/{id}); 404 i błędy pomija. */
export function refreshNewReplies(maxAgeMs = 0): Promise<void> {
  if (inflight) return inflight;
  if (updatedAt !== null && Date.now() - updatedAt < maxAgeMs) return Promise.resolve();
  const ids = listMyIdeas().map((x) => x.idea_id);
  inflight = Promise.all(
    ids.map((id) =>
      api.idea(id).then(
        (idea) => [id, idea.reply_count] as const,
        (err: unknown) => (err instanceof ApiError && err.status === 404 ? ([id, 0] as const) : null),
      ),
    ),
  )
    .then((results) => {
      const next = { ...replyCounts };
      for (const r of results) if (r) next[r[0]] = r[1];
      replyCounts = next;
      updatedAt = Date.now();
      recompute();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Liczba pomysłów z nową odpowiedzią Hubu (reply_count > seen_replies). Odświeżanie przy wejściu
 * na każdą stronę i co 30 s, z pauzą na ukrytej karcie; markRepliesSeen/forgetIdea przeliczają od razu.
 */
export function useNewReplies(): number {
  const { pathname } = useLocation();
  const count = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    // Równoczesne wywołania (MainNav + KreatorNav) łączy `inflight`.
    void refreshNewReplies(0);
  }, [pathname]);
  usePolling(() => void refreshNewReplies(FRESH_MS), NEW_REPLIES_POLL_MS);
  return count;
}
