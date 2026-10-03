import { useContrast } from "@/hooks/useContrast";

export function ContrastToggle() {
  const [on, setOn] = useContrast();
  return (
    <button
      className="ds-btn ds-btn--small"
      type="button"
      aria-pressed={on}
      onClick={() => setOn(!on)}
    >
      Wysoki kontrast
    </button>
  );
}
