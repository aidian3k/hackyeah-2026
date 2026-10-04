import type { CSSProperties } from "react";

interface Props {
  /** Podpis, np. „Cała mapa” albo „Arkusz 1”. */
  label: string;
  filled: number;
  total: number;
  /** Mniejszy wariant (zakładki arkuszy): podpis i liczba w jednej linii pod paskiem. */
  compact?: boolean;
}

export function percentOf(filled: number, total: number): number {
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

/**
 * Postęp wypełnienia kanwy: tekst („3 z 10 pól, 30%”) + pasek `ds-bar` (dekoracja, `aria-hidden`).
 * Liczby są w tekście, więc pasek nie jest jedyną informacją.
 */
export function CanvasProgressBar({ label, filled, total, compact = false }: Props) {
  const percent = percentOf(filled, total);
  const text = `${filled} z ${total} ${total === 1 ? "pola" : "pól"} (${percent}%)`;
  return (
    <div className={`flex min-w-0 flex-col ${compact ? "gap-1" : "gap-2"}`}>
      <p className={`m-0 ${compact ? "text-small" : "text-body"} text-ink`}>
        {compact ? <span className="ds-sr-only">{`${label}: `}</span> : <strong>{`${label}: `}</strong>}
        {text}
      </p>
      {/* ds-bar--navy ustawia tylko kolor wypełnienia (zmienna dziedziczona przez ścieżkę). */}
      <span className="ds-bar--navy" aria-hidden="true">
        <span className="ds-bar__track">
          <span className="ds-bar__fill" style={{ "--ds-bar-share": `${percent}%` } as CSSProperties} />
        </span>
      </span>
    </div>
  );
}
