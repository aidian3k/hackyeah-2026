import { useId, useRef } from "react";
import type { BlockValue, CanvasBlock, CanvasOption } from "@/api/types";
import { LevelIndicator } from "@/components/canvas/LevelIndicator";

interface Props {
  block: CanvasBlock;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  readOnly?: boolean;
}

/** Bloki ze skalą ułożoną pionowo (na planszy strzałka „coraz częściej” w górę). */
const VERTICAL_SCALE = new Set(["problem_frequency"]);

interface OptionCardProps {
  option: CanvasOption;
  name: string;
  checked: boolean;
  onSelect: () => void;
  /** Opis pokazany pod etykietą (domyślnie `option.description`); `null` ukrywa opis. */
  description?: string | null;
}

/** Karta opcji `radio`: etykieta, opis i wskaźnik poziomu. Cała karta jest klikalna. */
export function OptionCard({ option, name, checked, onSelect, description }: OptionCardProps) {
  const titleId = useId();
  const levelId = useId();
  const descId = useId();
  const desc = description === undefined ? option.description : description;
  const level = option.level ?? null;
  return (
    <label className="ds-choice">
      <input
        type="radio"
        className="ds-choice__input"
        name={name}
        value={option.code}
        checked={checked}
        onChange={onSelect}
        aria-labelledby={level ? `${titleId} ${levelId}` : titleId}
        aria-describedby={desc ? descId : undefined}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span id={titleId}>{option.label}</span>
        {desc && (
          <span id={descId} className="text-small font-normal text-ink-muted">
            {desc}
          </span>
        )}
      </span>
      {level && <LevelIndicator level={level} id={levelId} />}
    </label>
  );
}

/** Wybrana opcja jako tekst i znacznik poziomu (tryb tylko do odczytu). */
export function SingleChoiceValue({ option }: { option: CanvasOption | undefined }) {
  if (!option) return <p className="m-0 text-body text-ink-muted">Brak odpowiedzi.</p>;
  return (
    <div className="flex items-start gap-3 rounded-md border border-solid border-line px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-bold text-ink">{option.label}</span>
        {option.description && <span className="text-small text-ink-muted">{option.description}</span>}
      </div>
      {option.level ? <LevelIndicator level={option.level} /> : null}
    </div>
  );
}

/** Pionowa oś skali (dekoracja): strzałka w górę = częściej. */
function VerticalAxis() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 12 100" preserveAspectRatio="none" className="w-3 shrink-0 self-stretch text-line-strong">
      <line x1="6" y1="98" x2="6" y2="4" strokeWidth={2} vectorEffect="non-scaling-stroke" className="stroke-current" />
      <polyline points="1,10 6,2 11,10" strokeWidth={2} vectorEffect="non-scaling-stroke" className="fill-none stroke-current" />
    </svg>
  );
}

/** Blok `single`: grupa `radio` z opcjami jako kartami, przy skalach wskaźnik poziomu 1–4, „Wyczyść”. */
export function SingleChoiceBlock({ block, value, onChange, readOnly = false }: Props) {
  const name = useId();
  const promptId = useId();
  const groupRef = useRef<HTMLFieldSetElement>(null);
  const selected = typeof value === "string" ? value : null;
  const selectedOption = block.options.find((o) => o.code === selected);

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-body-lg font-bold text-ink">{block.title}</span>
        <SingleChoiceValue option={selectedOption} />
      </div>
    );
  }

  function clear() {
    if (!selected) return;
    onChange(null);
    groupRef.current?.querySelector<HTMLInputElement>("input[type=radio]")?.focus();
  }

  const vertical = VERTICAL_SCALE.has(block.id);
  const options = block.options.map((o) => (
    <OptionCard key={o.code} option={o} name={name} checked={selected === o.code} onSelect={() => onChange(o.code)} />
  ));

  return (
    <fieldset ref={groupRef} className="ds-choices" aria-describedby={promptId}>
      <legend className="ds-choices__legend">{block.title}</legend>
      <p id={promptId} className="ds-choices__hint">
        {block.prompt}
      </p>
      {vertical ? (
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-small text-ink-muted" aria-hidden="true">
              Częściej
            </span>
            <VerticalAxis />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">{options}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">{options}</div>
      )}
      {selected && (
        <div>
          <button type="button" className="ds-btn ds-btn--link ds-btn--small px-0" onClick={clear}>
            Wyczyść wybór
            <span className="ds-sr-only">{`: ${block.title}`}</span>
          </button>
        </div>
      )}
    </fieldset>
  );
}
