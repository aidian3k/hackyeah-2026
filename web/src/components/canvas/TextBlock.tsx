import { useId } from "react";
import type { BlockValue, CanvasBlock } from "@/api/types";

/** Lustro CANVAS_TEXT_MAX_CHARS (api/config.py): maks. długość bloku `text`. */
export const CANVAS_TEXT_MAX_CHARS = 2000;

interface Props {
  block: CanvasBlock;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  readOnly?: boolean;
}

/** Blok `text`: pole wieloliniowe z licznikiem znaków. Puste pole = `null` (usunięcie bloku). */
export function TextBlock({ block, value, onChange, readOnly = false }: Props) {
  const fieldId = useId();
  const promptId = useId();
  const counterId = useId();
  const text = typeof value === "string" ? value : "";

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-body-lg font-bold text-ink">{block.title}</span>
        {text.trim() ? (
          <p className="m-0 whitespace-pre-wrap text-body [overflow-wrap:anywhere]">{text}</p>
        ) : (
          <p className="m-0 text-body text-ink-muted">Brak odpowiedzi.</p>
        )}
      </div>
    );
  }

  const atLimit = text.length >= CANVAS_TEXT_MAX_CHARS;
  return (
    <div className="ds-field">
      <label htmlFor={fieldId} className="ds-label">
        {block.title}
      </label>
      <p id={promptId} className="ds-hint">
        {block.prompt}
      </p>
      <textarea
        id={fieldId}
        className="ds-textarea min-h-32 resize-y"
        rows={4}
        value={text}
        maxLength={CANVAS_TEXT_MAX_CHARS}
        aria-describedby={`${promptId} ${counterId}`}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      />
      <p id={counterId} className="ds-counter" data-state={atLimit ? "limit" : undefined}>
        {`${text.length} / ${CANVAS_TEXT_MAX_CHARS} znaków`}
      </p>
    </div>
  );
}
