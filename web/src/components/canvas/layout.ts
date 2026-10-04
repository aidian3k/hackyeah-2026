/**
 * Układ plansz Social Canvas (PDF INNOAGH) na siatce Tailwinda.
 *
 * - ≥ `xl`: pozycje jak na planszach (wiersz 1 = nagłówki obszarów, potem bloki).
 * - `md`: 2 kolumny w kolejności czytania (nagłówek obszaru na całą szerokość, bloki po dwa).
 * - poniżej: 1 kolumna w kolejności definicji.
 *
 * Klasy są pisane w całości jako literały, żeby Tailwind je znalazł (bez sklejania nazw).
 */

/** Kontener siatki arkusza. */
export const SHEET_GRID_CLASS: Record<string, string> = {
  S1: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
  S2: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
  S3: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
};

export const DEFAULT_SHEET_GRID_CLASS = "grid grid-cols-1 gap-4 md:grid-cols-2";

/** Nagłówek obszaru: na `md` cała szerokość, na `xl` kolumna(y) obszaru. */
export const AREA_CLASS: Record<string, string> = {
  // S1
  problem: "md:col-span-2 xl:col-span-1 xl:col-start-1 xl:row-start-1",
  actors: "md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1",
  solution: "md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1",
  costs: "md:col-span-2 xl:col-span-1 xl:col-start-4 xl:row-start-1",
  // S2
  recipients: "md:col-span-2 xl:col-span-1 xl:col-start-1 xl:row-start-1",
  revenue: "md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1",
  value: "md:col-span-2 xl:col-start-3 xl:row-start-1",
  // S3
  channels: "md:col-span-2 xl:col-span-1 xl:col-start-1 xl:row-start-1",
  partners: "md:col-span-2 xl:col-start-2 xl:row-start-1",
  impact: "md:col-span-2 xl:col-start-2 xl:row-start-4",
};

export const DEFAULT_AREA_CLASS = "md:col-span-2";

/**
 * Pozycja bloku. Klucz `impact` = cała macierz wpływu (`ImpactMatrix`), renderowana raz zamiast trzech bloków.
 */
export const BLOCK_CLASS: Record<string, string> = {
  // S1 — kolumny: problem | aktorzy | rozwiązanie | koszty
  problem_intensity: "xl:col-start-1 xl:row-start-2",
  problem_frequency: "xl:col-start-1 xl:row-start-3",
  problem_scale: "xl:col-start-1 xl:row-start-4",
  actors_support: "xl:col-start-2 xl:row-start-2",
  actors_block: "xl:col-start-2 xl:row-start-3",
  solution_value: "xl:col-start-3 xl:row-start-2",
  solution_readiness: "xl:col-start-3 xl:row-start-3",
  solution_clarity: "xl:col-span-2 xl:col-start-2 xl:row-start-4",
  costs_fixed: "xl:col-start-4 xl:row-start-2",
  costs_variable: "xl:col-start-4 xl:row-span-2 xl:row-start-3",
  // S2 — kolumny: odbiorcy | dochody | wartość (2 kolumny)
  recipients_users: "xl:col-start-1 xl:row-start-2",
  recipients_payers: "xl:col-start-1 xl:row-span-2 xl:row-start-3",
  recipients_deciders: "xl:col-start-1 xl:row-start-5",
  revenue_main: "xl:col-start-2 xl:row-start-2",
  revenue_main_note: "xl:col-start-2 xl:row-start-3",
  revenue_scaling: "xl:col-start-2 xl:row-start-4",
  revenue_scaling_note: "xl:col-start-2 xl:row-start-5",
  value_emotional: "md:col-span-2 xl:col-start-3 xl:row-span-2 xl:row-start-2",
  value_functional: "md:col-span-2 xl:col-start-3 xl:row-span-2 xl:row-start-4",
  // S3 — kolumny: kanały | partnerzy (2 kolumny), pod nimi wpływ
  channels_direct: "xl:col-start-1 xl:row-start-2",
  channels_partners: "xl:col-start-1 xl:row-start-3",
  channels_extra: "xl:col-start-1 xl:row-span-2 xl:row-start-4",
  partners: "md:col-span-2 xl:col-start-2 xl:row-span-2 xl:row-start-2",
  impact: "md:col-span-2 xl:col-start-2 xl:row-start-5",
};

/** Obszar renderowany jako jedna macierz (bloki `single` z tymi samymi poziomami). */
export const MATRIX_AREA_ID = "impact";

/**
 * Mapa arkusza (krok po kroku, `SheetMap`) i schemat planszy (`SheetIllustration`): kolumny jak na planszach PDF.
 * `span` = względna szerokość kolumny; kilka obszarów w kolumnie leży jeden pod drugim (S3: partnerzy nad wpływem).
 */
export const MAP_COLUMNS: Record<string, { areas: string[]; span: number }[]> = {
  S1: [
    { areas: ["problem"], span: 1 },
    { areas: ["actors"], span: 1 },
    { areas: ["solution"], span: 1 },
    { areas: ["costs"], span: 1 },
  ],
  S2: [
    { areas: ["recipients"], span: 1 },
    { areas: ["revenue"], span: 1 },
    { areas: ["value"], span: 2 },
  ],
  S3: [
    { areas: ["channels"], span: 1 },
    { areas: ["partners", "impact"], span: 2 },
  ],
};

/** Siatka kolumn mapy arkusza (od `md`; niżej jedna kolumna). Literały w całości dla Tailwinda. */
export const MAP_GRID_CLASS: Record<string, string> = {
  S1: "md:grid-cols-4",
  S2: "md:grid-cols-4",
  S3: "md:grid-cols-3",
};

/** Szerokość kolumny mapy według `span`. */
export const MAP_SPAN_CLASS: Record<number, string> = { 1: "md:col-span-1", 2: "md:col-span-2" };

/** Obszary, których kafelki stoją obok siebie (jak kolumny macierzy wpływu i dwie grupy wartości). */
export const MAP_ROW_AREAS = new Set(["impact", "value"]);
