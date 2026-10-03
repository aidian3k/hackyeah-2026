import type { ReportStatus, ReporterType } from "@/api/types";

export const PRIVACY_WARNING = "Nie wpisuj imion, adresów ani danych o zdrowiu konkretnych osób.";
export const MESSAGE_MAX_CHARS = 2000; // backend i tak przycina zapytanie do MAX_QUERY_CHARS = 2000

export const REPORTER_TYPE_LABELS: Record<ReporterType, string> = {
  RESIDENT: "Mieszkaniec lub mieszkanka",
  NGO: "Organizacja społeczna",
  JST: "Samorząd",
  OTHER: "Nie chcę podawać",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  NEW: "Nowe",
  TRIAGED: "Przejrzane",
  MATCHED: "Dopasowane",
  IN_PROGRESS: "W toku",
  CLOSED: "Zamknięte",
};

// Lustro reguł backendu (409 INVALID_TRANSITION).
export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  NEW: ["TRIAGED"],
  TRIAGED: ["MATCHED", "IN_PROGRESS"],
  MATCHED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CLOSED"],
  CLOSED: [],
};

// 1, 3, 5 ze specyfikacji; 2 i 4 uzupełnione przez frontend.
export const EVIDENCE_LABELS: Record<number, string> = {
  1: "Pomysł",
  2: "Przetestowane w małej skali",
  3: "Wdrożone w jednej gminie",
  4: "Wdrożone w kilku miejscach",
  5: "Wdrożone wielokrotnie, z oceną efektów",
};

// OTHER i nieznane → sama klasa ds-tag.
export const CATEGORY_TAG_CLASS: Record<string, string> = {
  AGING: "ds-tag--starzenie",
  MENTAL_HEALTH: "ds-tag--psych",
  LONELINESS: "ds-tag--samotnosc",
  DIGITAL_EXCLUSION: "ds-tag--cyfrowe",
  SERVICE_ACCESS: "ds-tag--dostep",
  DEPOPULATION: "ds-tag--osadnictwo",
  SUBURBAN_GROWTH: "ds-tag--osadnictwo",
  COORDINATION: "ds-tag--koordynacja",
};

export const EXAMPLE_PROMPTS: string[] = [
  "Starsi sąsiedzi siedzą sami w domach i nie mają z kim porozmawiać",
  "Młodzież czeka miesiącami na wizytę u psychologa",
  "Seniorzy nie umieją załatwić spraw w urzędzie przez internet",
  "Z naszej wsi nie da się dojechać do lekarza bez samochodu",
];
