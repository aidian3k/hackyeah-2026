import { useId, useRef } from "react";
import type { BlockValue, CanvasBlock, CanvasOption } from "@/api/types";
import { LevelIndicator } from "@/components/canvas/LevelIndicator";

interface Props {
  /** Bloki wpływu (`impact_person`, `impact_community`, `impact_environment`) — każdy to kolumna macierzy. */
  blocks: CanvasBlock[];
  /** Wartości bloków (`{block_id: "KOD"}`); brak klucza = nic nie wybrano. */
  values: Record<string, BlockValue | undefined>;
  onChange: (blockId: string, value: BlockValue | null) => void;
  readOnly?: boolean;
  /** Klasy siatki kolumn (pisane w całości); domyślnie 3 kolumny dopiero od `xl`, niżej jedna pod drugą. */
  columnsClassName?: string;
}

/** Poziomy od najsilniejszego (góra macierzy) do najsłabszego. */
function levelsDesc(options: CanvasOption[]): CanvasOption[] {
  return [...options].sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
}

interface ColumnProps {
  block: CanvasBlock;
  value: string | null;
  onChange: (value: BlockValue | null) => void;
  descIds: Record<string, string>;
}

function ImpactColumn({ block, value, onChange, descIds }: ColumnProps) {
  const name = useId();
  const promptId = useId();
  const ref = useRef<HTMLFieldSetElement>(null);
  return (
    <fieldset ref={ref} className="ds-choices min-w-0" aria-describedby={promptId}>
      <legend className="ds-choices__legend">{block.title}</legend>
      {levelsDesc(block.options).map((o) => (
        <ImpactOption
          key={o.code}
          option={o}
          name={name}
          checked={value === o.code}
          onSelect={() => onChange(o.code)}
          descId={descIds[o.code]}
        />
      ))}
      <p id={promptId} className="ds-hint">
        {block.prompt}
      </p>
      {value && (
        <div>
          <button
            type="button"
            className="ds-btn ds-btn--link ds-btn--small px-0"
            onClick={() => {
              onChange(null);
              ref.current?.querySelector<HTMLInputElement>("input[type=radio]")?.focus();
            }}
          >
            Wyczyść wybór
            <span className="ds-sr-only">{`: ${block.title}`}</span>
          </button>
        </div>
      )}
    </fieldset>
  );
}

function ImpactOption({
  option,
  name,
  checked,
  onSelect,
  descId,
}: {
  option: CanvasOption;
  name: string;
  checked: boolean;
  onSelect: () => void;
  descId?: string;
}) {
  const titleId = useId();
  const levelId = useId();
  return (
    <label className="ds-choice text-body">
      <input
        type="radio"
        className="ds-choice__input"
        name={name}
        value={option.code}
        checked={checked}
        onChange={onSelect}
        aria-labelledby={option.level ? `${titleId} ${levelId}` : titleId}
        aria-describedby={descId}
      />
      <span id={titleId} className="min-w-0 flex-1">
        {option.label}
      </span>
      {option.level ? <LevelIndicator level={option.level} id={levelId} /> : null}
    </label>
  );
}

/**
 * Macierz wpływu: 3 kolumny (wpływ na osobę, społeczność, środowisko) × 4 poziomy.
 * Każda kolumna to grupa `radio` z `legend`; opisy poziomów (wspólne) są raz, pod macierzą.
 */
export function ImpactMatrix({
  blocks,
  values,
  onChange,
  readOnly = false,
  columnsClassName = "grid-cols-1 xl:grid-cols-3",
}: Props) {
  const legendBaseId = useId();
  const levels = levelsDesc(blocks[0]?.options ?? []);
  const descIds = Object.fromEntries(levels.map((o) => [o.code, `${legendBaseId}-${o.code}`]));
  const valueOf = (b: CanvasBlock) => {
    const v = values[b.id];
    return typeof v === "string" ? v : null;
  };

  const levelLegend = (
    <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 text-small sm:grid-cols-2">
      {levels.map((o) => (
        <div key={o.code} className="flex items-start gap-2">
          <dt className="flex shrink-0 items-start gap-2 font-bold text-ink">
            {o.level ? <LevelIndicator level={o.level} /> : null}
            <span>{`${o.label}:`}</span>
          </dt>
          <dd id={descIds[o.code]} className="m-0 text-ink-muted">
            {o.description}
          </dd>
        </div>
      ))}
    </dl>
  );

  if (readOnly) {
    return (
      <div className="flex flex-col gap-3">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-body">
            <caption className="ds-sr-only">Macierz wpływu</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2 text-left">
                  <span className="ds-sr-only">Poziom</span>
                </th>
                {blocks.map((b) => (
                  <th key={b.id} scope="col" className="border-0 border-b border-solid border-line p-2 text-left text-small font-bold">
                    {b.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levels.map((o) => (
                <tr key={o.code}>
                  <th scope="row" className="border-0 border-b border-solid border-line p-2 text-left text-small font-bold">
                    <span className="inline-flex items-center gap-2">
                      {o.level ? <LevelIndicator level={o.level} /> : null}
                      {o.label}
                    </span>
                  </th>
                  {blocks.map((b) => {
                    const on = valueOf(b) === o.code;
                    return (
                      <td key={b.id} className="border-0 border-b border-solid border-line p-2 text-center">
                        {on ? (
                          <span className="inline-flex items-center gap-1 font-bold text-navy">
                            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-6 w-6">
                              <circle cx="12" cy="12" r="9" className="fill-current" />
                            </svg>
                            <span className="ds-sr-only">wybrane</span>
                          </span>
                        ) : (
                          <>
                            <span className="text-ink-muted" aria-hidden="true">
                              –
                            </span>
                            <span className="ds-sr-only">nie</span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {levelLegend}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-4 ${columnsClassName}`}>
        {blocks.map((b) => (
          <ImpactColumn key={b.id} block={b} value={valueOf(b)} onChange={(v) => onChange(b.id, v)} descIds={descIds} />
        ))}
      </div>
      {levelLegend}
    </div>
  );
}
