interface Props {
  /** Pełne serce = wartość wybrana, kontur = niewybrana (kształt, nie tylko kolor). */
  filled?: boolean;
  className?: string;
}

/** Serce z planszy „Wartość emocjonalna” (dekoracja; znaczenie niesie tekst obok). */
export function HeartShape({ filled = false, className = "h-6 w-6" }: Props) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={`shrink-0 text-navy ${className}`}>
      <path
        d="M12 20.5 4.2 12.9a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.8.8.8-.8a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7z"
        strokeWidth={2}
        strokeLinejoin="round"
        className={filled ? "fill-current stroke-current" : "fill-none stroke-current"}
      />
    </svg>
  );
}
