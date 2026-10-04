import type { BlockValue, CanvasArea, CanvasBlock, CanvasDefinition, CanvasSheet, Partner } from "@/api/types";
import { completePartners } from "@/components/canvas/PartnersBlock";

/** Id kroku wstępu i podsumowania arkusza w `?krok=`. */
export const INTRO_STEP = "wstep";
export const SUMMARY_STEP = "podsumowanie";

export type CanvasStep =
  | { kind: "intro"; id: typeof INTRO_STEP }
  | { kind: "block"; id: string; block: CanvasBlock; area: CanvasArea }
  | { kind: "summary"; id: typeof SUMMARY_STEP };

/** Kroki arkusza: wstęp, bloki w kolejności obszarów (kolejność czytania planszy), podsumowanie. */
export function buildSheetSteps(definition: CanvasDefinition, sheet: CanvasSheet): CanvasStep[] {
  const byId = new Map(definition.blocks.map((b) => [b.id, b]));
  const blocks: CanvasStep[] = sheet.areas.flatMap((area) =>
    area.blocks
      .map((id) => byId.get(id))
      .filter((b): b is CanvasBlock => b !== undefined)
      .map((block) => ({ kind: "block" as const, id: block.id, block, area })),
  );
  return [{ kind: "intro", id: INTRO_STEP }, ...blocks, { kind: "summary", id: SUMMARY_STEP }];
}

/** Bloki całej kanwy w kolejności kroków (do numeracji „Pytanie n z 26”). */
export function allBlockIds(definition: CanvasDefinition): string[] {
  return definition.sheets.flatMap((s) => buildSheetSteps(definition, s).flatMap((st) => (st.kind === "block" ? [st.id] : [])));
}

/** Link do kroku: `?arkusz=<1..3>&krok=<id>`. */
export function stepHref(sheetNo: number, stepId: string): string {
  return `?arkusz=${sheetNo}&krok=${encodeURIComponent(stepId)}`;
}

/** Indeks kroku z `?krok=`; brak albo nieznany = wstęp (0). */
export function parseStep(raw: string | null, steps: CanvasStep[]): number {
  if (!raw) return 0;
  const i = steps.findIndex((s) => s.id === raw);
  return i >= 0 ? i : 0;
}

/** Czy blok liczy się jako uzupełniony — jak `_is_filled` w API; partnerzy tylko kompletni. */
export function isBlockFilled(block: CanvasBlock, value: BlockValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (block.type === "partners") {
    return Array.isArray(value) && completePartners(value as Partner[]).length > 0;
  }
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const v = value as { selected?: unknown[]; other?: unknown[] };
    return (v.selected?.length ?? 0) + (v.other?.length ?? 0) > 0;
  }
  return Boolean(value);
}
