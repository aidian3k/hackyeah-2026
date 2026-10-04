/** Mapa kafelkowa 22 powiatów Małopolski (ADR-M2-004, ADR-M2-007): układ siatki i skala kwantylowa. */

export const MAP_SCALE_STEPS = 4;

/** Położenie kafelka (kolumny 1–6, wiersze 1–5): północ u góry, zachód po lewej, w przybliżeniu jak na mapie. */
export const POWIAT_TILES: Record<string, { col: number; row: number }> = {
  olkuski: { col: 2, row: 1 },
  miechowski: { col: 3, row: 1 },
  proszowicki: { col: 5, row: 1 },
  chrzanowski: { col: 1, row: 2 },
  krakowski: { col: 2, row: 2 },
  Kraków: { col: 3, row: 2 },
  wielicki: { col: 4, row: 2 },
  brzeski: { col: 5, row: 2 },
  dąbrowski: { col: 6, row: 2 },
  oświęcimski: { col: 1, row: 3 },
  wadowicki: { col: 2, row: 3 },
  myślenicki: { col: 3, row: 3 },
  bocheński: { col: 4, row: 3 },
  tarnowski: { col: 5, row: 3 },
  Tarnów: { col: 6, row: 3 },
  suski: { col: 2, row: 4 },
  nowotarski: { col: 3, row: 4 },
  limanowski: { col: 4, row: 4 },
  nowosądecki: { col: 5, row: 4 },
  gorlicki: { col: 6, row: 4 },
  tatrzański: { col: 3, row: 5 },
  "Nowy Sącz": { col: 5, row: 5 },
};

// Pełne nazwy klas (Tailwind skanuje źródła tekstowo, więc nie składamy ich z fragmentów).
export const COL_START: Record<number, string> = {
  1: "sm:col-start-1",
  2: "sm:col-start-2",
  3: "sm:col-start-3",
  4: "sm:col-start-4",
  5: "sm:col-start-5",
  6: "sm:col-start-6",
};
export const ROW_START: Record<number, string> = {
  1: "sm:row-start-1",
  2: "sm:row-start-2",
  3: "sm:row-start-3",
  4: "sm:row-start-4",
  5: "sm:row-start-5",
};

/** Progi kwantylowe: `steps - 1` wartości; wartość `v` trafia do stopnia = liczba progów ≤ v. */
export function quantileThresholds(values: number[], steps: number = MAP_SCALE_STEPS): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const thresholds: number[] = [];
  for (let i = 1; i < steps; i++) {
    const t = sorted[Math.min(sorted.length - 1, Math.floor((i * sorted.length) / steps))];
    if (t !== undefined) thresholds.push(t);
  }
  return thresholds;
}

/** Stopień 0…steps-1; najwyższy stopień = „najgorzej” (przy `higherIsWorse = false` skala jest odwrócona). */
export function scaleStep(value: number, thresholds: number[], higherIsWorse: boolean): number {
  const step = thresholds.filter((t) => value >= t).length;
  return higherIsWorse ? step : thresholds.length - step;
}

/**
 * Klasy stopni skali (od najjaśniejszego). Stopnie niosą też grubość obramowania, bo w wysokim
 * kontraście tła są czarne; `stripe-blue` nie jest tam nadpisany, więc stopień 2 dostaje tło i tekst
 * z tokenów powierzchni (kontrast ≥ 7:1).
 */
export const STEP_CLASSES = [
  "border border-line bg-surface-sunken text-ink",
  "border border-line-strong bg-soft-blue text-navy",
  "border-2 border-navy bg-stripe-blue text-navy-on [:root[data-contrast=high]_&]:bg-surface [:root[data-contrast=high]_&]:text-ink",
  "border-2 border-navy bg-navy text-navy-on",
] as const;

export const STEP_LABELS = ["najniższe wartości", "niższe średnie", "wyższe średnie", "najwyższe wartości"] as const;
