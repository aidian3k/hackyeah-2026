interface Props {
  /** Poziom opcji skali (1–4, najmocniejsza = 4). */
  level: number;
  max?: number;
  className?: string;
  /** Id tekstu dla czytników — do `aria-labelledby` kontrolki, której dotyczy poziom. */
  id?: string;
}

/**
 * Wskaźnik poziomu skali: słupki rosnącej wysokości, wypełnione do `level`.
 * Kształt (liczba pełnych słupków) niesie informację bez koloru; poziom podany jest też tekstem dla czytników.
 */
export function LevelIndicator({ level, max = 4, className = "", id }: Props) {
  const bars = Array.from({ length: max }, (_, i) => i + 1);
  const w = 6;
  const gap = 3;
  const width = max * w + (max - 1) * gap;
  const height = 20;
  return (
    <span className={`inline-flex shrink-0 items-center text-navy ${className}`}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${width + 2} ${height + 2}`}
        className="h-6 w-8"
      >
        {bars.map((n) => {
          const h = (height * n) / max;
          const filled = n <= level;
          return (
            <rect
              key={n}
              x={1 + (n - 1) * (w + gap)}
              y={1 + height - h}
              width={w}
              height={h}
              rx={1}
              strokeWidth={1.5}
              className={filled ? "fill-current stroke-current" : "fill-none stroke-current"}
            />
          );
        })}
      </svg>
      <span id={id} className="ds-sr-only">{`poziom ${level} z ${max}`}</span>
    </span>
  );
}
