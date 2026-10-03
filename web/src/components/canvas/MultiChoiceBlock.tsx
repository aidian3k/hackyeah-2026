import { useId, useRef, useState } from "react";
import type { BlockValue, CanvasBlock, MultiValue } from "@/api/types";
import { HeartShape } from "@/components/canvas/HeartShape";
import { CANVAS_LIST_MAX_ITEMS, EntryAdder, EntryList } from "@/components/canvas/ListBlock";

interface Props {
  block: CanvasBlock;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  readOnly?: boolean;
}

type Variant = "hearts" | "tiles" | "chips";

function variantOf(blockId: string): Variant {
  if (blockId === "value_emotional") return "hearts";
  if (blockId === "value_functional") return "tiles";
  return "chips";
}

function asMulti(value: BlockValue | undefined): MultiValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      selected: Array.isArray(value.selected) ? value.selected : [],
      other: Array.isArray(value.other) ? value.other : [],
    };
  }
  return { selected: [], other: [] };
}

/** Wybrane opcje i własne wpisy jako znaczniki (tryb tylko do odczytu). */
function MultiValueView({ block, multi, variant }: { block: CanvasBlock; multi: MultiValue; variant: Variant }) {
  const labels = block.options.filter((o) => multi.selected.includes(o.code)).map((o) => o.label);
  if (labels.length === 0 && multi.other.length === 0) {
    return <p className="m-0 text-body text-ink-muted">Nic nie wybrano.</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {labels.map((l) => (
        <li key={l} className="ds-tag inline-flex items-center gap-1">
          {variant === "hearts" && <HeartShape filled className="h-4 w-4" />}
          {l}
        </li>
      ))}
      {multi.other.map((o, i) => (
        <li key={`o-${i}-${o}`} className="ds-tag inline-flex items-center gap-1 [overflow-wrap:anywhere]">
          {variant === "hearts" && <HeartShape filled className="h-4 w-4" />}
          {o}
          <span className="font-normal">(własny wpis)</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Blok `multi`: pola wyboru jako karty („Wartość emocjonalna” z sercami, „Wartość funkcjonalna” jako kafelki),
 * limit `max` z ogłaszanym licznikiem, własne wpisy („Dopisz własną”, „Usuń <wpis>”).
 */
export function MultiChoiceBlock({ block, value, onChange, readOnly = false }: Props) {
  const promptId = useId();
  const counterId = useId();
  const multi = asMulti(value);
  const variant = variantOf(block.id);
  const [limitNote, setLimitNote] = useState("");
  const adderRef = useRef<HTMLDivElement>(null);

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-body-lg font-bold text-ink">{block.title}</span>
        <MultiValueView block={block} multi={multi} variant={variant} />
      </div>
    );
  }

  const count = multi.selected.length + multi.other.length;
  const max = block.max ?? null;
  const full = max !== null && count >= max;

  function emit(next: MultiValue) {
    // Kolejność wybranych jak w definicji; pusta wartość = usunięcie bloku.
    const selected = block.options.map((o) => o.code).filter((c) => next.selected.includes(c));
    onChange(selected.length || next.other.length ? { selected, other: next.other } : null);
  }

  function toggle(code: string, checked: boolean) {
    if (checked && full) {
      setLimitNote(`Możesz wybrać najwyżej ${max}. Odznacz jedną pozycję, żeby wybrać inną.`);
      return;
    }
    setLimitNote("");
    emit({
      selected: checked ? [...multi.selected, code] : multi.selected.filter((c) => c !== code),
      other: multi.other,
    });
  }

  function removeOther(index: number) {
    setLimitNote("");
    emit({ selected: multi.selected, other: multi.other.filter((_, i) => i !== index) });
    adderRef.current?.querySelector("input")?.focus();
  }

  const listClass =
    variant === "tiles"
      ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
      : variant === "hearts"
        ? "flex flex-col gap-2"
        : "flex flex-wrap gap-2";

  const blockedReason = full
    ? `Wybrano już ${max} z ${max}. Odznacz albo usuń jedną pozycję, żeby dopisać własną.`
    : multi.other.length >= CANVAS_LIST_MAX_ITEMS
      ? `Masz już ${CANVAS_LIST_MAX_ITEMS} własnych wpisów.`
      : null;

  return (
    <fieldset className="ds-choices gap-3" aria-describedby={max !== null ? `${promptId} ${counterId}` : promptId}>
      <legend className="ds-choices__legend">{block.title}</legend>
      <p id={promptId} className="ds-choices__hint">
        {block.prompt}
      </p>
      {variant === "hearts" && (
        <div className="flex items-center gap-2" aria-hidden="true">
          {Array.from({ length: max ?? 3 }, (_, i) => (
            <HeartShape key={i} filled={i < count} className="h-8 w-8" />
          ))}
        </div>
      )}
      {max !== null && (
        <p id={counterId} className="ds-counter text-left" data-state={full ? "limit" : undefined} aria-live="polite">
          {`Wybrano ${count} z ${max}`}
        </p>
      )}
      <div className={listClass}>
        {block.options.map((o) => {
          const checked = multi.selected.includes(o.code);
          const disabled = full && !checked;
          return (
            <label
              key={o.code}
              className={[
                "ds-choice",
                variant === "chips" ? "text-body" : "",
                variant === "tiles" ? "min-h-16" : "",
                disabled ? "cursor-not-allowed border-dashed text-ink-muted" : "",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="ds-choice__input"
                value={o.code}
                checked={checked}
                aria-disabled={disabled ? true : undefined}
                onChange={(e) => toggle(o.code, e.target.checked)}
              />
              {variant === "hearts" && <HeartShape filled={checked} />}
              <span className="min-w-0 [overflow-wrap:anywhere]">{o.label}</span>
            </label>
          );
        })}
      </div>
      <p className="ds-hint" aria-live="polite">
        {limitNote}
      </p>
      <EntryList entries={multi.other} onRemove={removeOther} label={`Własne wpisy: ${block.title}`} />
      <div ref={adderRef}>
        <EntryAdder
          label="Dopisz własną"
          existing={[...multi.other, ...block.options.map((o) => o.label)]}
          onAdd={(entry) => emit({ selected: multi.selected, other: [...multi.other, entry] })}
          blockedReason={blockedReason}
        />
      </div>
    </fieldset>
  );
}
