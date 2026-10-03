import type { ReportSavedEvent } from "@/api/types";

/** plural(1,"osoba","osoby","osób") → "osoba"; 2–4 (poza 12–14) → few; reszta → many. */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });

/** "3 października 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** "3 października 2026, 18:42" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

/** "przed chwilą", "15 min temu", "2 godz. temu", "wczoraj", potem formatDate. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= startOfToday) return `${Math.floor(minutes / 60)} godz. temu`;
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfYesterday) return "wczoraj";
  return formatDate(iso);
}

export function scaleMessage(s: ReportSavedEvent): string {
  const n = s.similar_count;
  if (n === 0) return "Jesteś pierwszą osobą, która zgłasza ten problem.";
  const people = `${n} ${plural(n, "osoba", "osoby", "osób")}`;
  if (s.gmina_count <= 1) return `Podobny problem zgłosiło już ${people}.`;
  const m = s.gmina_count;
  return `Podobny problem zgłosiło już ${people} z ${m} ${plural(m, "gminy", "gmin", "gmin")}.`;
}
