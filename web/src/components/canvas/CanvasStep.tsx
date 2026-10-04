import { type ReactNode, type Ref } from "react";
import { Link } from "react-router-dom";
import type { AssistSuggestion, BlockValue, CanvasArea, CanvasBlock, CanvasDefinition, CanvasSheet } from "@/api/types";
import { AssistPanel } from "@/components/assistant/AssistPanel";
import { CanvasBlockView } from "@/components/canvas/CanvasBlockView";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { CanvasIcon, FilledMark, SheetIllustration } from "@/components/canvas/CanvasArt";
import { type CanvasStep, isBlockFilled, stepHref } from "@/components/canvas/steps";
import { plural } from "@/lib/format";

/** Jedno zdanie o arkuszu na jego wstępie. */
const SHEET_INTRO: Record<string, string> = {
  S1: "Opiszcie, jak poważny jest problem, kto wspiera zmianę, a kto ją utrudnia, jak dojrzałe jest rozwiązanie i ile kosztuje.",
  S2: "Określcie, komu pomagacie, kto płaci, skąd będą pieniądze i jaką wartość dajecie odbiorcom.",
  S3: "Zaplanujcie, jak dotrzecie do odbiorców, kto Was wesprze i jaką zmianę przyniesie rozwiązanie.",
};

const headingClass = "m-0 font-sans text-h2 text-navy [overflow-wrap:anywhere]";

function sheetBlocks(definition: CanvasDefinition, sheet: CanvasSheet): CanvasBlock[] {
  const byId = new Map(definition.blocks.map((b) => [b.id, b]));
  return sheet.areas.flatMap((a) => a.blocks.map((id) => byId.get(id)).filter((b): b is CanvasBlock => !!b));
}

/**
 * Postęp w arkuszu: „Krok N z M” + segmenty (dekoracja; pełny segment = blok uzupełniony, wyższy = bieżący krok).
 */
export function StepProgress({
  steps,
  index,
  sheetNo,
  blocks,
  questionText,
}: {
  steps: CanvasStep[];
  index: number;
  sheetNo: number;
  blocks: Record<string, BlockValue | undefined>;
  /** Np. „Pytanie 5 z 26” (tylko kroki bloków). */
  questionText?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="m-0 flex flex-wrap gap-x-3 text-body text-ink">
        <strong>{`Arkusz ${sheetNo} · krok ${index + 1} z ${steps.length}`}</strong>
        {questionText && <span className="text-ink-muted">{questionText}</span>}
      </p>
      <ol aria-hidden="true" className="m-0 flex list-none items-end gap-1 p-0">
        {steps.map((s, i) => {
          const filled = s.kind === "block" ? isBlockFilled(s.block, blocks[s.block.id]) : i < index;
          const current = i === index;
          return (
            <li
              key={s.id}
              className={`min-w-0 flex-1 rounded-sm border border-solid border-navy ${current ? "h-3" : "h-2"} ${
                filled || current ? "bg-navy" : "bg-surface"
              }`}
            />
          );
        })}
      </ol>
    </div>
  );
}

interface BlockStepProps {
  block: CanvasBlock;
  area: CanvasArea;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  error: string | null;
  headingRef: Ref<HTMLHeadingElement>;
  ideaId: number;
  onAssist: (blockId: string, suggestion: AssistSuggestion) => void;
}

/** Krok jednego bloku: obszar z ikoną, `h2` z tytułem, kontrolka, zwinięte „Podpowiedz”. */
export function BlockStep({ block, area, value, onChange, error, headingRef, ideaId, onAssist }: BlockStepProps) {
  const filled = isBlockFilled(block, value);
  return (
    <section aria-labelledby={`krok-${block.id}`} className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="inline-flex shrink-0 rounded-lg border border-solid border-line bg-surface-muted p-3 text-navy">
          <CanvasIcon area={area.id} blockId={block.id} className="h-10 w-10" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-label uppercase tracking-wide text-ink">{area.title}</p>
          <h2 id={`krok-${block.id}`} ref={headingRef} tabIndex={-1} className={headingClass}>
            {block.title}
          </h2>
          <p className="m-0 inline-flex items-center gap-2 text-small text-ink">
            <FilledMark filled={filled} className="h-4 w-4 text-navy" />
            {filled ? "Uzupełnione" : "Jeszcze puste"}
          </p>
        </div>
      </div>
      <div className="ds-card min-w-0">
        <CanvasBlockView block={block} value={value} onChange={onChange} error={error} titleHidden />
      </div>
      <details>
        <summary className="ds-btn ds-btn--link ds-btn--small cursor-pointer px-0">
          Podpowiedz
          <span className="ds-sr-only">{`: ${block.title}`}</span>
        </summary>
        <div className="mt-2 rounded-md border border-solid border-line bg-surface-muted p-3">
          <AssistPanel
            key={block.id}
            ideaId={ideaId}
            target="canvas_block"
            blockId={block.id}
            blockType={block.type}
            onAccept={(s) => onAssist(block.id, s)}
            headingLevel={3}
          />
        </div>
      </details>
    </section>
  );
}

interface SheetIntroProps {
  definition: CanvasDefinition;
  sheet: CanvasSheet;
  sheetNo: number;
  blocks: Record<string, BlockValue | undefined>;
  headingRef: Ref<HTMLHeadingElement>;
}

/** Wstęp arkusza: schemat planszy, jedno zdanie, obszary z liczbą uzupełnionych pól. */
export function SheetIntro({ definition, sheet, sheetNo, blocks, headingRef }: SheetIntroProps) {
  const byId = new Map(definition.blocks.map((b) => [b.id, b]));
  const all = sheetBlocks(definition, sheet);
  const filled = all.filter((b) => isBlockFilled(b, blocks[b.id])).length;
  return (
    <section aria-labelledby="krok-wstep" className="flex min-w-0 flex-col gap-4">
      <h2 id="krok-wstep" ref={headingRef} tabIndex={-1} className={headingClass}>
        {`Arkusz ${sheetNo}: ${sheet.title}`}
      </h2>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <SheetIllustration sheet={sheet} className="w-full max-w-md" />
        <div className="flex min-w-0 flex-col gap-3">
          <p className="m-0 text-body-lg text-ink">{SHEET_INTRO[sheet.id] ?? sheet.title}</p>
          <p className="m-0 text-body text-ink">
            {`Odpowiecie na ${all.length} ${plural(all.length, "pytanie", "pytania", "pytań")}, po jednym na ekranie. Uzupełnione: ${filled} z ${all.length}.`}
          </p>
          <ul aria-label="Obszary arkusza" className="m-0 flex list-none flex-col gap-2 p-0">
            {sheet.areas.map((a) => {
              const areaBlocks = a.blocks.map((id) => byId.get(id)).filter((b): b is CanvasBlock => !!b);
              const n = areaBlocks.filter((b) => isBlockFilled(b, blocks[b.id])).length;
              return (
                <li key={a.id} className="flex items-center gap-3 text-body text-ink">
                  <CanvasIcon area={a.id} className="h-6 w-6 text-navy" />
                  <span className="min-w-0 flex-1">
                    <strong>{a.title}</strong>
                    <span className="text-ink-muted">{` · ${n} z ${areaBlocks.length}`}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

interface SheetSummaryProps {
  definition: CanvasDefinition;
  sheet: CanvasSheet;
  sheetNo: number;
  blocks: Record<string, BlockValue | undefined>;
  headingRef: Ref<HTMLHeadingElement>;
  children?: ReactNode;
}

/** Podsumowanie arkusza: puste pola z linkami, cały arkusz tylko do odczytu z „Zmień”, potem `children` (Co dalej?). */
export function SheetSummary({ definition, sheet, sheetNo, blocks, headingRef, children }: SheetSummaryProps) {
  const all = sheetBlocks(definition, sheet);
  const empty = all.filter((b) => !isBlockFilled(b, blocks[b.id]));
  return (
    <section aria-labelledby="krok-podsumowanie" className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id="krok-podsumowanie" ref={headingRef} tabIndex={-1} className={headingClass}>
          {`Podsumowanie arkusza ${sheetNo}`}
        </h2>
        <p className="m-0 text-body-lg text-ink">
          {empty.length === 0
            ? "Wszystkie pola tego arkusza są uzupełnione."
            : `Uzupełniono ${all.length - empty.length} z ${all.length}. Puste pola możecie zostawić i wrócić do nich później.`}
        </p>
        {empty.length > 0 && (
          <ul aria-label="Puste pola" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {empty.map((b) => (
              <li key={b.id}>
                <Link to={stepHref(sheetNo, b.id)} className="ds-btn ds-btn--small inline-flex items-center gap-2">
                  <FilledMark filled={false} className="h-4 w-4" />
                  <span>
                    <span className="ds-sr-only">Uzupełnij: </span>
                    {b.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
      <CanvasBoard
        definition={definition}
        blocks={blocks}
        sheet={sheet.id}
        readOnly
        headingLevel={3}
        editHref={(blockId) => stepHref(sheetNo, blockId)}
      />
    </section>
  );
}
