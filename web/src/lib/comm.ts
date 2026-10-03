// Moduł 5 — Platforma komunikacji: stałe, etykiety i pamięć „Moich rozmów” w przeglądarce.
import type { Intent, MessageRole, OrgSector, ThreadKind, ThreadMessage, ThreadStatus } from "@/api/comm";

/** Odpytywanie otwartej rozmowy; szybciej, gdy asystent jeszcze szuka odpowiedzi. */
export const THREAD_POLL_MS = 5_000;
export const AI_POLL_MS = 2_000;
/** Licznik „Rozmowy” w nawigacji panelu. */
export const COMM_COUNT_POLL_MS = 30_000;
/** Limit wiadomości w rozmowie (backend: `MessageCreate.body`, max 4000). */
export const COMM_MESSAGE_MAX_CHARS = 4000;

export type Viewer = "author" | "staff" | "mentor";

export const THREAD_KIND_LABELS: Record<ThreadKind, string> = {
  QUESTION: "Pytanie do Hubu",
  MENTORING: "Konsultacja z ekspertem",
  PARTNERSHIP: "Propozycja partnerstwa",
};

export function threadStatusLabel(status: ThreadStatus, viewer: Viewer): string {
  switch (status) {
    case "AI_PENDING":
      return "Asystent szuka odpowiedzi";
    case "WAITING_STAFF":
      return "Czeka na zespół Hubu";
    case "WAITING_USER":
      return viewer === "author" ? "Jest odpowiedź" : "Czeka na autora";
    case "CLOSED":
      return "Zamknięta";
  }
}

const ROLE_LABELS: Record<Exclude<MessageRole, "USER" | "MENTOR">, string> = {
  STAFF: "Zespół Hubu",
  ASSISTANT: "Odpowiedź automatyczna (AI)",
  SYSTEM: "Informacja",
};

/** Kto napisał wiadomość — słownie, z perspektywy oglądającego. */
export function messageRoleLabel(msg: Pick<ThreadMessage, "role" | "mentor">, viewer: Viewer): string {
  if (msg.role === "USER") return viewer === "author" ? "Ty" : "Autor";
  if (msg.role === "MENTOR") return msg.mentor ? `Ekspert: ${msg.mentor.display_name}` : "Ekspert";
  return ROLE_LABELS[msg.role];
}

export const SECTOR_LABELS: Record<OrgSector, string> = {
  NGO: "Organizacja pozarządowa",
  JST: "Samorząd",
  PUBLIC: "Instytucja publiczna",
  BUSINESS: "Firma",
  SCIENCE: "Uczelnia / nauka",
  RESIDENTS: "Grupa mieszkańców",
};

export const INTENT_LABELS: Record<Intent, string> = {
  OFFER: "Oferujemy",
  SEEK: "Szukamy",
};

// --- „Moje rozmowy” w tej przeglądarce (wzór: lib/storage.ts) --------------------
// Każdy dostęp w try/catch — gdy pamięć nie działa, aplikacja działa dalej, tylko nie pamięta.
// Pełna treść nie trafia do pamięci; tylko skrót (excerpt) do rozpoznania rozmowy.

const THREADS_KEY = "splot_threads";
const MAX_THREADS = 20;
const EXCERPT_CHARS = 80;

export interface MyThread {
  thread_id: number;
  created_at: string; // ISO
  excerpt: string;
}

function isMyThread(x: unknown): x is MyThread {
  if (!x || typeof x !== "object") return false;
  const t = x as Record<string, unknown>;
  return typeof t.thread_id === "number" && typeof t.created_at === "string" && typeof t.excerpt === "string";
}

export function listMyThreads(): MyThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMyThread).slice(0, MAX_THREADS) : [];
  } catch {
    return [];
  }
}

function saveMyThreads(list: MyThread[]): void {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(list.slice(0, MAX_THREADS)));
  } catch {
    // pamięć niedostępna
  }
}

/** Dodaje rozmowę na początek listy (najnowsze pierwsze). */
export function rememberThread(t: MyThread): void {
  const entry: MyThread = { ...t, excerpt: t.excerpt.trim().slice(0, EXCERPT_CHARS) };
  saveMyThreads([entry, ...listMyThreads().filter((x) => x.thread_id !== t.thread_id)]);
}

export function forgetThread(threadId: number): void {
  saveMyThreads(listMyThreads().filter((x) => x.thread_id !== threadId));
}
