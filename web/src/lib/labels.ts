import type {
  ApplicationStatus,
  InnovationTestStatus,
  MaterialType,
  ReportStatus,
  ReporterType,
  TesterType,
  TestMode,
} from "@/api/types";
// Moduł 3: Kreator pomysłów
import type { CallState, IdeaStage, IdeaStatus } from "@/api/types";

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

export const TESTER_TYPE_LABELS: Record<TesterType, string> = {
  RESIDENT: "Mieszkaniec lub mieszkanka",
  TARGET_MEMBER: "Osoba z grupy docelowej",
  CAREGIVER: "Opiekun lub opiekunka",
  NGO: "Organizacja społeczna",
  JST: "Samorząd",
  SOCIAL_INSTITUTION: "Instytucja społeczna",
  OTHER: "Inny typ",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Złożono",
  ACCEPTED: "Zaakceptowano",
  REJECTED: "Odrzucono",
  COMPLETED: "Ukończono",
  CANCELED: "Anulowano",
};

export const TEST_STATUS_LABELS: Record<InnovationTestStatus, string> = {
  OPEN: "Otwarty",
  CLOSED: "Zamknięty",
};

export const TEST_MODE_LABELS: Record<TestMode, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrydowy",
};

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  FILE: "Plik",
  LINK: "Link",
  APP: "Aplikacja lub demo",
  INSTRUCTION: "Instrukcja",
  OFFLINE_SERVICE: "Usługa offline",
};

export const RATING_SCALE_LABELS: Record<number, string> = {
  1: "bardzo słabo",
  2: "słabo",
  3: "średnio",
  4: "dobrze",
  5: "bardzo dobrze",
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

// --- Moduł 3: Kreator pomysłów ---
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  DRAFT: "Szkic",
  SUBMITTED: "Wysłany",
  IN_REVIEW: "W ocenie Hubu",
  INVITED: "Zaproszony do rozmowy",
  REJECTED: "Odrzucony",
};

/** Kolejność opcji etapu = kolejność w bloku `solution_readiness` kanwy. */
export const IDEA_STAGES: IdeaStage[] = ["IDEA", "PROTOTYPE", "TESTED", "READY"];

// Etykiety i opisy jak w bloku „Gotowość do wdrożenia” Social Canvas (data/social-canvas.json).
export const IDEA_STAGE_LABELS: Record<IdeaStage, string> = {
  IDEA: "Pomysł",
  PROTOTYPE: "Prototyp",
  TESTED: "Przetestowane rozwiązanie",
  READY: "Gotowe do wdrożenia",
};

export const IDEA_STAGE_DESCRIPTIONS: Record<IdeaStage, string> = {
  IDEA: "Mamy koncepcję, ale rozwiązanie nie zostało jeszcze sprawdzone z odbiorcami.",
  PROTOTYPE: "Mamy pierwszą wersję rozwiązania, jednak wciąż wymaga ona testów i dopracowania.",
  TESTED: "Rozwiązanie zostało sprawdzone z realnymi użytkownikami i wiemy, co trzeba poprawić.",
  READY: "Rozwiązanie można uruchomić w rzeczywistym miejscu, z prawdziwymi odbiorcami i znanymi zasobami.",
};

export const CALL_STATE_LABELS: Record<CallState, string> = {
  open: "Nabór otwarty",
  upcoming: "Nabór wkrótce",
  closed: "Nabór zamknięty",
};

export const ASSIST_PRIVACY_NOTE = "Asystent korzysta z zewnętrznego modelu AI. Nie wpisuj danych osobowych.";
