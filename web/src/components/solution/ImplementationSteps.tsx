import "@/styles/solution.css";

interface Props {
  steps: string[];
}

/** „Jak to wdrożyć”: kroki jako lista numerowana (kolejność ma znaczenie). Pusta lista → nic. */
export function ImplementationSteps({ steps }: Props) {
  const items = steps.map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ol className="impl-steps">
      {items.map((step, i) => (
        <li key={i} className="impl-steps__item">
          {step}
        </li>
      ))}
    </ol>
  );
}
