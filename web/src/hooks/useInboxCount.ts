import { useEffect, useSyncExternalStore } from "react";
import { api, type ApiError } from "@/api/client";
import type { Inbox } from "@/api/types";
import { toApiError } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import { plural } from "@/lib/format";

/** Co ile panel odpytuje /api/inbox (zamiast webhooka, ADR-018). */
export const INBOX_POLL_MS = 30_000;

/**
 * Odpowiedź młodsza niż ten próg wystarcza kolejnemu odpytaniu. Dzięki temu nawigacja panelu
 * i strona „Nowe” (dwa liczniki usePolling) robią razem jedno żądanie na okres.
 */
const FRESH_MS = INBOX_POLL_MS * 0.9;

export interface InboxSnapshot {
  data: Inbox | null;
  /** Błąd ostatniego odpytania; poprzednie dane zostają w `data`. */
  error: ApiError | null;
  /** Trwa pierwsze wczytanie (bez danych). Odświeżanie w tle nie zmienia tej flagi. */
  loading: boolean;
  /** Kiedy przyszła ostatnia odpowiedź (Date.now()), także błędna. */
  updatedAt: number | null;
  /** Komunikat dla czytników ekranu, gdy liczby zmieniły się przy odświeżeniu. */
  announcement: string;
}

// Wspólny stan modułu: jedna skrzynka na aplikację, bez względu na liczbę odbiorców.
let snapshot: InboxSnapshot = { data: null, error: null, loading: true, updatedAt: null, announcement: "" };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function setSnapshot(patch: Partial<InboxSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function describeChange(prev: Inbox, next: Inbox): string {
  if (prev.new_reports === next.new_reports && prev.pending_solutions === next.pending_solutions) return "";
  return (
    `Skrzynka zaktualizowana: ${next.new_reports} ` +
    `${plural(next.new_reports, "nowe zgłoszenie", "nowe zgłoszenia", "nowych zgłoszeń")}, ` +
    `${next.pending_solutions} ` +
    `${plural(next.pending_solutions, "pomysł", "pomysły", "pomysłów")} do zatwierdzenia.`
  );
}

/**
 * Pobiera /api/inbox, chyba że żądanie już trwa albo ostatnia odpowiedź jest młodsza niż `maxAgeMs`.
 * `maxAgeMs = 0` wymusza świeże dane (wejście na stronę, przycisk „Odśwież”).
 */
export function refreshInbox(maxAgeMs = 0): Promise<void> {
  if (inflight) return inflight;
  if (snapshot.updatedAt !== null && Date.now() - snapshot.updatedAt < maxAgeMs) return Promise.resolve();
  inflight = api
    .inbox()
    .then(
      (data) => {
        const announcement = snapshot.data ? describeChange(snapshot.data, data) : "";
        setSnapshot({
          data,
          error: null,
          loading: false,
          updatedAt: Date.now(),
          // Bez zmiany liczb zostawiamy poprzedni tekst, żeby region aria-live nie powtarzał komunikatu.
          announcement: announcement || snapshot.announcement,
        });
      },
      (err: unknown) => {
        setSnapshot({ error: toApiError(err), loading: false, updatedAt: Date.now() });
      },
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Skrzynka panelu: wczytanie przy montowaniu i odpytywanie co 30 s (pauza na ukrytej karcie). */
export function useInbox(): InboxSnapshot {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void refreshInbox(0);
  }, []);
  usePolling(() => void refreshInbox(FRESH_MS), INBOX_POLL_MS);
  return state;
}

/** Licznik przy „Nowe” w nawigacji panelu: nowe zgłoszenia + pomysły do zatwierdzenia; null przy błędzie. */
export function useInboxCount(): number | null {
  const { data, error } = useInbox();
  if (error || !data) return null;
  return data.new_reports + data.pending_solutions;
}
