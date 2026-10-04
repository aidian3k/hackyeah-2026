import { useState } from "react";
import { Link } from "react-router-dom";
import type { BlockValue, CanvasBlock, CanvasDefinition, CanvasSheet } from "@/api/types";
import { CanvasIcon, FilledMark } from "@/components/canvas/CanvasArt";
import { MAP_COLUMNS, MAP_GRID_CLASS, MAP_SPAN_CLASS } from "@/components/canvas/layout";
import { INTRO_STEP, SUMMARY_STEP, isBlockFilled, stepHref } from "@/components/canvas/steps";

interface Props {
  definition: CanvasDefinition;
  sheet: CanvasSheet;
  /** Numer arkusza 1–3 (do linków). */
  sheetNo: number;
  blocks: Record<string, BlockValue | undefined>;
  /** Id bieżącego kroku (`block_id`, `wstep`, `podsumowanie`). */
  currentStep: string;
}

/** Kafelki obok siebie (jak kolumny macierzy wpływu i dwie grupy wartości na planszy). */
const ROW_LIST_CLASS: Record<string, string> = {
  impact: "sm:grid-cols-3",
  value: "sm:grid-cols-2",
};

const WIDE_QUERY = "(min-width: 768px)";

function isWide(): boolean {
  try {
    return window.matchMedia(WIDE_QUERY).matches;
  } catch {
    return true;
  }
}

function Tile({
  block,
  sheetNo,
  filled,
  current,
}: {
  block: CanvasBlock;
  sheetNo: number;
  filled: boolean;
  current: boolean;
}) {
  const state = current
    ? "border-navy bg-navy text-navy-on"
    : filled
      ? "border-line bg-surface text-navy hover:bg-surface-sunken"
      : "border-dashed border-line-strong bg-surface text-navy hover:bg-surface-sunken";
  return (
    <Link
      to={stepHref(sheetNo, block.id)}
      aria-current={current ? "step" : undefined}
      className={`flex min-h-11 items-center gap-2 rounded-md border-2 border-solid px-2 py-1 no-underline ${state}`}
    >
      <CanvasIcon area={block.area} blockId={block.id} className="h-5 w-5" />
      <span className={`min-w-0 flex-1 text-small [overflow-wrap:anywhere] ${current ? "font-bold" : ""}`}>{block.title}</span>
      <FilledMark filled={filled} inverted={current} />
      <span className="ds-sr-only">{`${filled ? ", uzupełnione" : ", puste"}${current ? ", bieżący krok" : ""}`}</span>
    </Link>
  );
}

/**
 * Mapa arkusza na wzór planszy PDF: kolumny obszarów, w nich kafelki bloków (ikona, tytuł, stan).
 * Kafelek prowadzi do kroku; bieżący ma `aria-current="step"`. Na telefonie mapa jest domyślnie zwinięta.
 */
export function SheetMap({ definition, sheet, sheetNo, blocks, currentStep }: Props) {
  const [open, setOpen] = useState(isWide);
  const byId = new Map(definition.blocks.map((b) => [b.id, b]));
  const columns = MAP_COLUMNS[sheet.id] ?? sheet.areas.map((a) => ({ areas: [a.id], span: 1 }));
  const sheetBlocks = sheet.areas.flatMap((a) => a.blocks.map((id) => byId.get(id)).filter((b): b is CanvasBlock => !!b));
  const filledCount = sheetBlocks.filter((b) => isBlockFilled(b, blocks[b.id])).length;

  const edgeLink = (stepId: string, label: string) => {
    const current = currentStep === stepId;
    return (
      <Link
        to={stepHref(sheetNo, stepId)}
        aria-current={current ? "step" : undefined}
        className={`ds-btn ds-btn--small ${current ? "ds-btn--primary" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="rounded-lg border border-solid border-line bg-surface-muted p-3"
    >
      <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-2 font-sans text-nav text-navy">
        {`Mapa arkusza ${sheetNo}`}
        <span className="text-small font-normal text-ink">{`${filledCount} z ${sheetBlocks.length} uzupełnionych`}</span>
      </summary>
      <nav aria-label={`Mapa arkusza ${sheetNo}: ${sheet.title}`} className="mt-3 flex flex-col gap-3">
        <div className={`grid grid-cols-1 gap-3 ${MAP_GRID_CLASS[sheet.id] ?? "md:grid-cols-3"}`}>
          {columns.map((col) => (
            <div key={col.areas.join("-")} className={`flex min-w-0 flex-col gap-3 ${MAP_SPAN_CLASS[col.span] ?? ""}`}>
              {col.areas.map((areaId) => {
                const area = sheet.areas.find((a) => a.id === areaId);
                if (!area) return null;
                const areaBlocks = area.blocks.map((id) => byId.get(id)).filter((b): b is CanvasBlock => !!b);
                return (
                  <div key={area.id} className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-solid border-line bg-surface p-2">
                    <p className="m-0 inline-flex items-center gap-2 text-label uppercase tracking-wide text-ink">
                      <CanvasIcon area={area.id} className="h-5 w-5 text-navy" />
                      {area.title}
                    </p>
                    <ul
                      aria-label={area.title}
                      className={`m-0 grid list-none grid-cols-1 gap-2 p-0 ${ROW_LIST_CLASS[area.id] ?? ""}`}
                    >
                      {areaBlocks.map((b) => (
                        <li key={b.id} className="min-w-0">
                          <Tile block={b} sheetNo={sheetNo} filled={isBlockFilled(b, blocks[b.id])} current={currentStep === b.id} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {edgeLink(INTRO_STEP, "Wstęp arkusza")}
          {edgeLink(SUMMARY_STEP, "Podsumowanie arkusza")}
        </div>
      </nav>
    </details>
  );
}
