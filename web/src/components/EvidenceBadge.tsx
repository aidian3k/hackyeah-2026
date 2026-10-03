import { EVIDENCE_LABELS } from "@/lib/labels";
import "@/styles/components.css";

interface Props {
  level: number;
  /** false → bez przedrostka „Poziom sprawdzenia:” (gdy etykietę daje już np. `dt` w ds-meta). */
  withLabel?: boolean;
}

const MAX_LEVEL = 5;

/** „Poziom sprawdzenia: 4 z 5 — Wdrożone w kilku miejscach”. Kropki są tylko ozdobą, informację niesie tekst. */
export function EvidenceBadge({ level, withLabel = true }: Props) {
  const n = Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
  const name = EVIDENCE_LABELS[n];
  return (
    <span className="evidence-badge">
      <span className="evidence-badge__dots" aria-hidden="true">
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <span key={i} className="evidence-badge__dot" data-filled={i < n ? "true" : undefined} />
        ))}
      </span>
      <span>
        {withLabel && "Poziom sprawdzenia: "}
        {n} z {MAX_LEVEL}
        {name && ` — ${name}`}
      </span>
    </span>
  );
}
