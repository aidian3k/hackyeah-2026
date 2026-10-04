import type { ReactNode } from "react";
import { useContrast } from "@/hooks/useContrast";
import { useTextSize } from "@/hooks/useTextSize";
import type { TextSize } from "@/lib/storage";

// Kwadratowe przyciski 36 px (WCAG 2.5.8: min. 24 px); wybrany stan jak wybrany chip.
const TOOL =
  "ds-btn ds-btn--small h-9 w-9 min-h-0 px-0 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-navy-on";
const ICON = "h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]";

const SIZES: { size: TextSize; mark: ReactNode; name: string }[] = [
  { size: "normal", mark: "A", name: "Podstawowy rozmiar tekstu" },
  { size: "large", mark: "A+", name: "Większy tekst" },
  { size: "xlarge", mark: "A++", name: "Największy tekst" },
];

/** Pasek ułatwień jak na rops.krakow.pl: rozmiar tekstu i wysoki kontrast — małe przyciski. */
export function AccessibilityToolbar() {
  const [contrast, setContrast] = useContrast();
  const [textSize, setTextSize] = useTextSize();

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Ułatwienia dostępu">
      {SIZES.map(({ size, mark, name }) => (
        <button
          key={size}
          type="button"
          className={`${TOOL} text-small`}
          title={name}
          aria-pressed={textSize === size}
          onClick={() => setTextSize(size)}
        >
          <span aria-hidden="true">{mark}</span>
          <span className="ds-sr-only">{name}</span>
        </button>
      ))}

      <button
        type="button"
        className={TOOL}
        title="Wysoki kontrast"
        aria-pressed={contrast}
        onClick={() => setContrast(!contrast)}
      >
        <svg className={ICON} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" />
          <path className="fill-current" d="M12 3a9 9 0 0 1 0 18z" />
        </svg>
        <span className="ds-sr-only">Wysoki kontrast</span>
      </button>
    </div>
  );
}
