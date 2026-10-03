import type { Stage, StatusEvent } from "@/api/types";

interface Props {
  /** Ostatnie zdarzenie `status` (null = jeszcze nic nie przyszło). */
  stage: StatusEvent | null;
}

const STAGES: Stage[] = ["preprocess", "search", "rerank", "answer"];

// Etykiety kroków, których `status` jeszcze nie przyszedł (te same co w backendzie).
const DEFAULT_LABELS: Record<Stage, string> = {
  preprocess: "Analizuję opis problemu...",
  search: "Szukam w bazie rozwiązań...",
  rerank: "Wybieram najlepiej pasujące...",
  answer: "Przygotowuję podsumowanie...",
};

/**
 * Postęp wyszukiwania (4 kroki). Lista nie jest regionem aria-live — czytnik dostaje
 * osobno tylko etykietę bieżącego etapu, bez powtarzania całej listy.
 */
export function StageProgress({ stage }: Props) {
  const current = stage ? STAGES.indexOf(stage.stage) : 0;
  // Etykieta z backendu dla bieżącego kroku, pozostałe domyślne.
  const labelOf = (s: Stage) => (stage && stage.stage === s ? stage.label_pl : DEFAULT_LABELS[s]);

  return (
    <div className="stage-progress">
      <ol className="ds-progress" aria-label="Postęp wyszukiwania">
        {STAGES.map((s, i) => {
          if (i < current) {
            return (
              <li key={s} className="ds-progress__step" data-state="done">
                <span className="ds-progress__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </span>
                {labelOf(s)}
                <span className="ds-sr-only"> (gotowe)</span>
              </li>
            );
          }
          if (i === current) {
            return (
              <li key={s} className="ds-progress__step" aria-current="step">
                <span className="ds-progress__icon">
                  <span className="ds-spinner" aria-hidden="true" />
                </span>
                {labelOf(s)}
              </li>
            );
          }
          return (
            <li key={s} className="ds-progress__step">
              <span className="ds-progress__icon" aria-hidden="true" />
              {labelOf(s)}
            </li>
          );
        })}
      </ol>
      <p className="ds-sr-only" aria-live="polite" aria-atomic="true">
        {stage?.label_pl ?? ""}
      </p>
    </div>
  );
}
