import { useId } from "react";
import type { BlockValue, CanvasBlock } from "@/api/types";
import { ListBlock } from "@/components/canvas/ListBlock";
import { MultiChoiceBlock } from "@/components/canvas/MultiChoiceBlock";
import { PartnersBlock } from "@/components/canvas/PartnersBlock";
import { SingleChoiceBlock } from "@/components/canvas/SingleChoiceBlock";
import { TextBlock } from "@/components/canvas/TextBlock";

interface Props {
  block: CanvasBlock;
  /** Wartość z `CanvasState.blocks[block.id]`; `undefined` = blok pusty. */
  value: BlockValue | undefined;
  /** Nowa wartość bloku; `null` = usunięcie bloku (pusta wartość). Wymagane poza trybem `readOnly`. */
  onChange?: (value: BlockValue | null) => void;
  /** Wartości jako tekst i znaczniki, bez kontrolek. */
  readOnly?: boolean;
  /** Komunikat błędu zapisu bloku (np. 422 z API), pokazany pod blokiem. */
  error?: string | null;
  /** Tytuł bloku tylko dla czytników (krok kanwy pokazuje go już w nagłówku `h2`). */
  titleHidden?: boolean;
}

const noop = () => {};

/**
 * Blok Social Canvas renderowany z definicji: wybiera kontrolkę według `block.type`.
 * Bloki `impact_*` można też pokazać razem jako `ImpactMatrix` (3 kolumny) — tu każdy jest zwykłą grupą `radio`.
 */
export function CanvasBlockView({ block, value, onChange = noop, readOnly = false, error = null, titleHidden = false }: Props) {
  const errorId = useId();
  const props = { block, value, onChange, readOnly, titleHidden };
  let control;
  switch (block.type) {
    case "single":
      control = <SingleChoiceBlock {...props} />;
      break;
    case "multi":
      control = <MultiChoiceBlock {...props} />;
      break;
    case "list":
      control = <ListBlock {...props} />;
      break;
    case "text":
      control = <TextBlock {...props} />;
      break;
    case "partners":
      control = <PartnersBlock {...props} />;
      break;
    default:
      control = <p className="m-0 text-body text-ink-muted">{`Nieznany typ bloku: ${String(block.type)}`}</p>;
  }
  return (
    <div className="flex min-w-0 flex-col gap-2" data-block-id={block.id}>
      {control}
      {error && (
        <p id={errorId} className="ds-error m-0" role="alert">
          <strong>Błąd:</strong> {error}
        </p>
      )}
    </div>
  );
}
