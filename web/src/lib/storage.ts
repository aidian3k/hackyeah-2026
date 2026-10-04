// Pamięć przeglądarki. Każdy odczyt i zapis w try/catch — gdy pamięć nie działa
// (tryb prywatny, zablokowane dane), aplikacja działa dalej, tylko nie pamięta.
// Treść zgłoszeń nie trafia do sessionStorage; do localStorage tylko skrót (excerpt).

const SESSION_KEY = "splot_session";
const CONTRAST_KEY = "splot_contrast";
const TEXT_SIZE_KEY = "splot_text_size";
const REPORTS_KEY = "splot_reports";
const MAX_REPORTS = 20;
export const EXCERPT_CHARS = 80;

export interface MyReport {
  report_id: number;
  created_at: string; // ISO
  excerpt: string; // pierwsze 80 znaków wiadomości
  gmina: string | null;
}

let memorySessionId: string | null = null;

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = newId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    memorySessionId ??= newId();
    return memorySessionId;
  }
}

export function getContrast(): boolean {
  try {
    return localStorage.getItem(CONTRAST_KEY) === "high";
  } catch {
    return false;
  }
}

export function setContrast(on: boolean): void {
  try {
    if (on) localStorage.setItem(CONTRAST_KEY, "high");
    else localStorage.removeItem(CONTRAST_KEY);
  } catch {
    // pamięć niedostępna — ustawienie działa tylko do odświeżenia
  }
}

/** Rozmiar tekstu z paska ułatwień; `normal` nie jest zapisywany. */
export type TextSize = "normal" | "large" | "xlarge";

export function setTextSize(size: TextSize): void {
  try {
    if (size === "normal") localStorage.removeItem(TEXT_SIZE_KEY);
    else localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    // pamięć niedostępna — ustawienie działa tylko do odświeżenia
  }
}

function isMyReport(x: unknown): x is MyReport {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.report_id === "number" &&
    typeof r.created_at === "string" &&
    typeof r.excerpt === "string" &&
    (r.gmina === null || typeof r.gmina === "string")
  );
}

export function listMyReports(): MyReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMyReport).slice(0, MAX_REPORTS) : [];
  } catch {
    return [];
  }
}

function saveMyReports(list: MyReport[]): void {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, MAX_REPORTS)));
  } catch {
    // pamięć niedostępna
  }
}

/** Dodaje wpis na początek (najnowsze pierwsze). `excerpt` jest przycinany do 80 znaków. */
export function addMyReport(r: MyReport): void {
  const entry: MyReport = { ...r, excerpt: r.excerpt.trim().slice(0, EXCERPT_CHARS) };
  saveMyReports([entry, ...listMyReports().filter((x) => x.report_id !== r.report_id)]);
}

export function removeMyReport(id: number): void {
  saveMyReports(listMyReports().filter((x) => x.report_id !== id));
}
