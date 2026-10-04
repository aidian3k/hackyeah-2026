import { useId } from "react";

/**
 * Znak modułu „Matchmaking społeczny”: dwa koła (problem i rozwiązanie), część wspólna = dopasowanie.
 * Ozdobny (aria-hidden) — nazwę modułu niesie tekst obok. Kolory z tokenów pasków ROPS.
 * Ten sam wzór co ikona karty (`web/public/favicon.svg`).
 */
export function MatchmakingMark({ className = "" }: { className?: string }) {
  const clipId = `${useId()}-lewe`;
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <circle cx="24" cy="32" r="18" />
        </clipPath>
      </defs>
      <circle className="fill-stripe-magenta" cx="24" cy="32" r="18" />
      <circle className="fill-stripe-cyan" cx="40" cy="32" r="18" />
      <circle className="fill-navy" cx="40" cy="32" r="18" clipPath={`url(#${clipId})`} />
      <path
        className="fill-none stroke-navy-on [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:3]"
        d="m27 32 4 4 7-8"
      />
    </svg>
  );
}
