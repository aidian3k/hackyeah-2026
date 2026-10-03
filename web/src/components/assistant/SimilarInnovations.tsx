import { useId } from "react";
import { api } from "@/api/client";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";

interface Props {
  ideaId: number;
  /** Zmiana wartości wymusza ponowne pobranie (np. po zapisie fiszki). */
  refreshKey?: number | string;
  headingLevel?: 2 | 3;
}

const FALLBACK_UNAVAILABLE = "Wyszukiwanie podobnych innowacji jest teraz niedostępne. Spróbuj później.";
const FALLBACK_NO_MATCH = "Nie znaleźliśmy w Bibliotece innowacji podobnych do Twojego pomysłu.";

/** Podobne innowacje z Biblioteki (GET /api/ideas/{id}/similar), karty jak w całym serwisie. */
export function SimilarInnovations({ ideaId, refreshKey = 0, headingLevel = 2 }: Props) {
  const Heading = `h${headingLevel}` as const;
  const headingId = useId();
  const { data, error, loading, reload } = useApi(() => api.similar(ideaId), [ideaId, refreshKey]);

  return (
    <section aria-labelledby={headingId} aria-busy={loading} className="flex flex-col gap-4">
      <Heading id={headingId} className={`m-0 font-sans text-navy ${headingLevel === 2 ? "text-h2" : "text-h3"}`}>
        Podobne innowacje w Bibliotece
      </Heading>
      <LoadState loading={loading} error={error} onRetry={reload} label="Szukamy podobnych innowacji…">
        {data && !data.available && <Alert tone="info">{data.message_pl ?? FALLBACK_UNAVAILABLE}</Alert>}
        {data?.available && (data.solutions.length === 0 || !data.matched) && (
          <Alert tone="info">{data.message_pl ?? FALLBACK_NO_MATCH}</Alert>
        )}
        {data?.available && data.solutions.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
            {data.solutions.map((card) => (
              <li key={card.id}>
                <SolutionCard card={card} headingLevel={3} />
              </li>
            ))}
          </ul>
        )}
      </LoadState>
    </section>
  );
}
