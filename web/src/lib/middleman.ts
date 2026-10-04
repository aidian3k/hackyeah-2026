// Moduł 7: Middleman innowacji — stałe i teksty interfejsu.

/** Wiadomości w historii (obie strony) — jak `M7_MAX_MESSAGES` w backendzie. */
export const MIDDLEMAN_MAX_MESSAGES = 30;

export const MIDDLEMAN_QUICK_QUESTIONS: string[] = [
  "Kto u nas mógłby to prowadzić?",
  "Jak to uruchomić małymi siłami?",
  "Jak dotrzeć do odbiorców?",
  "Z kim warto współpracować?",
  "Co może pójść nie tak?",
  "Od czego zacząć w pierwszym miesiącu?",
];

export function middlemanGreeting(title: string): string {
  return `Dzień dobry! Pomogę zastanowić się, jak uruchomić „${title}” w Twojej instytucji. Wybierz pytanie poniżej albo napisz własne.`;
}

export const MIDDLEMAN_AI_NOTE =
  "Odpowiedzi przygotowuje sztuczna inteligencja na podstawie opisu innowacji z Biblioteki ROPS. To propozycje do sprawdzenia — asystent nie podaje kosztów. Nie wpisuj danych osobowych. Rozmowa nie jest zapisywana: zniknie po zamknięciu lub odświeżeniu strony.";

export const MIDDLEMAN_PATH = "/wdrozenie";

export function adaptPath(id: number): string {
  return `${MIDDLEMAN_PATH}/${id}`;
}
