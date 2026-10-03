/** Nazwy modułów z `docs/base.md` §2 — jedno źródło dla nawigacji i podpisów nad nagłówkami stron. */
export const MODULE_NAMES = {
  matchmaking: "Matchmaking społeczny",
  zasobnik: "Zasobnik wiedzy",
  kreator: "Kreator pomysłów",
  tester: "Tester innowacji",
  panel: "Panel administratora",
} as const;

export type ModuleKey = keyof typeof MODULE_NAMES;
