import { useId, useState } from "react";
import { Link } from "react-router-dom";
import type { AssistSuggestion, BlockValue, CanvasArea, CanvasBlock, CanvasDefinition } from "@/api/types";
import { AssistPanel } from "@/components/assistant/AssistPanel";
import { CanvasBlockView } from "@/components/canvas/CanvasBlockView";
import { ImpactMatrix } from "@/components/canvas/ImpactMatrix";
import {
  AREA_CLASS,
  BLOCK_CLASS,
  DEFAULT_AREA_CLASS,
  DEFAULT_SHEET_GRID_CLASS,
  MATRIX_AREA_ID,
  SHEET_GRID_CLASS,
} from "@/components/canvas/layout";

interface Props {
  definition: CanvasDefinition;
  /** Wartości bloków (`CanvasState.blocks` albo stan lokalny z `useCanvas`). */
  blocks: Record<string, BlockValue | undefined>;
  /** Id arkusza: `S1`, `S2`, `S3`. */
  sheet: string;
  /** Zmiana bloku; `null` = blok opróżniony. Wymagane poza trybem `readOnly`. */
  onBlockChange?: (blockId: string, value: BlockValue | null) => void;
  /** Wartości jako tekst i znaczniki, bez kontrolek (panel Hubu, K11). */
  readOnly?: boolean;
  /**
   * Przyjęcie podpowiedzi asystenta dla bloku. Gdy podane razem z `ideaId`,
   * przy każdym obszarze jest rozwijane „Podpowiedz” (`AssistPanel target="canvas_block"`).
   */
  onAssist?: (blockId: string, suggestion: AssistSuggestion) => void;
  ideaId?: number;
  /** Komunikaty błędów zapisu per blok. */
  blockErrors?: Record<string, string>;
  /** Poziom nagłówka arkusza; obszary mają poziom o jeden niższy (domyślnie `h2` / `h3`). */
  headingLevel?: 2 | 3;
  /** Tylko z `readOnly`: link „Zmień” przy każdym bloku (podsumowanie arkusza na kanwie krok po kroku). */
  editHref?: (blockId: string) => string;
}

const noop = () => {};

/** „Zmień” z nazwą bloku dla czytników. */
function EditLink({ to, title, showTitle = false }: { to: string; title: string; showTitle?: boolean }) {
  return (
    <Link to={to} className="ds-btn ds-btn--link ds-btn--small px-0">
      Zmień
      <span className={showTitle ? "" : "ds-sr-only"}>{`: ${title}`}</span>
    </Link>
  );
}

/** Podpowiedzi asystenta dla obszaru: wybór bloku (gdy jest ich kilka) + `AssistPanel`. */
function AreaAssist({
  ideaId,
  area,
  blocks,
  onAssist,
}: {
  ideaId: number;
  area: CanvasArea;
  blocks: CanvasBlock[];
  onAssist: (blockId: string, suggestion: AssistSuggestion) => void;
}) {
  const selectId = useId();
  const [blockId, setBlockId] = useState(blocks[0]?.id ?? "");
  const block = blocks.find((b) => b.id === blockId) ?? blocks[0];
  if (!block) return null;
  return (
    <details>
      <summary className="ds-btn ds-btn--link ds-btn--small cursor-pointer px-0">
        Podpowiedz
        <span className="ds-sr-only">{`: ${area.title}`}</span>
      </summary>
      <div className="mt-2 flex flex-col gap-3 rounded-md border border-solid border-line bg-surface-muted p-3">
        {blocks.length > 1 && (
          <div className="ds-field">
            <label htmlFor={selectId} className="ds-label">
              Czego ma dotyczyć podpowiedź?
            </label>
            <select id={selectId} className="ds-select" value={block.id} onChange={(e) => setBlockId(e.target.value)}>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <AssistPanel
          key={block.id}
          ideaId={ideaId}
          target="canvas_block"
          blockId={block.id}
          blockType={block.type}
          onAccept={(s) => onAssist(block.id, s)}
        />
      </div>
    </details>
  );
}

/**
 * Jeden arkusz Social Canvas w układzie planszy PDF: nagłówki obszarów (`h3`) i bloki według `layout.ts`.
 * Obszar „Wpływ” to jedna macierz (`ImpactMatrix`) zamiast trzech bloków.
 */
export function CanvasBoard({
  definition,
  blocks,
  sheet,
  onBlockChange = noop,
  readOnly = false,
  onAssist,
  ideaId,
  blockErrors = {},
  headingLevel = 2,
  editHref,
}: Props) {
  const sheetDef = definition.sheets.find((s) => s.id === sheet) ?? definition.sheets[0];
  const SheetHeading = `h${headingLevel}` as const;
  const AreaHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const headingId = useId();
  if (!sheetDef) return null;
  const byId = new Map(definition.blocks.map((b) => [b.id, b]));
  const sheetNo = definition.sheets.indexOf(sheetDef) + 1;
  const assist = !readOnly && onAssist && ideaId !== undefined;

  const items = sheetDef.areas.flatMap((area) => {
    const areaBlocks = area.blocks.map((id) => byId.get(id)).filter((b): b is CanvasBlock => b !== undefined);
    const header = (
      <div key={`area-${area.id}`} className={`flex min-w-0 flex-col gap-1 ${AREA_CLASS[area.id] ?? DEFAULT_AREA_CLASS}`}>
        <AreaHeading className="m-0 border-0 border-b-2 border-solid border-navy pb-1 font-sans text-h3 text-navy">
          {area.title}
        </AreaHeading>
        {assist && <AreaAssist ideaId={ideaId} area={area} blocks={areaBlocks} onAssist={onAssist} />}
      </div>
    );

    if (area.id === MATRIX_AREA_ID) {
      const errors = areaBlocks.filter((b) => blockErrors[b.id]);
      return [
        header,
        <div key="block-impact" className={`ds-card flex min-w-0 flex-col gap-2 ${BLOCK_CLASS[MATRIX_AREA_ID] ?? ""}`}>
          <ImpactMatrix
            blocks={areaBlocks}
            values={blocks}
            onChange={onBlockChange}
            readOnly={readOnly}
            columnsClassName="grid-cols-1 md:grid-cols-3"
          />
          {readOnly && editHref && (
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
              {areaBlocks.map((b) => (
                <li key={b.id}>
                  <EditLink to={editHref(b.id)} title={b.title} showTitle />
                </li>
              ))}
            </ul>
          )}
          {errors.map((b) => (
            <p key={b.id} className="ds-error m-0" role="alert">
              <strong>Błąd:</strong> {`${b.title}: ${blockErrors[b.id]}`}
            </p>
          ))}
        </div>,
      ];
    }

    return [
      header,
      ...areaBlocks.map((b) => (
        <div key={`block-${b.id}`} className={`ds-card min-w-0 ${BLOCK_CLASS[b.id] ?? ""}`}>
          <CanvasBlockView
            block={b}
            value={blocks[b.id]}
            onChange={(v) => onBlockChange(b.id, v)}
            readOnly={readOnly}
            error={blockErrors[b.id] ?? null}
          />
          {readOnly && editHref && (
            <p className="m-0 mt-2">
              <EditLink to={editHref(b.id)} title={b.title} />
            </p>
          )}
        </div>
      )),
    ];
  });

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <SheetHeading id={headingId} className="m-0 font-sans text-h2 text-navy">
        {`Arkusz ${sheetNo}: ${sheetDef.title}`}
      </SheetHeading>
      <div className={SHEET_GRID_CLASS[sheetDef.id] ?? DEFAULT_SHEET_GRID_CLASS}>{items}</div>
    </section>
  );
}
