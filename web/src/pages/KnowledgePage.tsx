import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { SolutionCard as SolutionCardData } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import "@/styles/catalog.css";

const KNOWLEDGE_LIMIT = 100;

/** Wiedza o wyzwaniach: wpisy KNOWLEDGE pogrupowane po wyzwaniach z /api/taxonomy (bez filtrów i paginacji). */
export function KnowledgePage() {
  useDocumentTitle("Wiedza o wyzwaniach");
  const { data, error, loading, reload } = useApi(
    () => api.solutions({ kind: "KNOWLEDGE", limit: KNOWLEDGE_LIMIT }),
    [],
  );
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const challenges = taxonomy.filter((t) => t.code !== "OTHER");
  const waitingForTaxonomy = taxonomy.length === 0 && !taxonomyError;

  const byCategory = new Map<string, SolutionCardData[]>();
  for (const card of data?.items ?? []) {
    const code = card.category ?? "";
    const list = byCategory.get(code);
    if (list) list.push(card);
    else byCategory.set(code, [card]);
  }
  const known = new Set(challenges.map((t) => t.code));
  const other = (data?.items ?? []).filter((c) => !c.category || !known.has(c.category));

  return (
    <div className="ds-page">
      <div className="ds-stack">
        <h1 tabIndex={-1}>Wiedza o wyzwaniach Małopolski</h1>
        <p className="catalog-lead">
          Diagnozy i opracowania o najważniejszych wyzwaniach społecznych regionu, uporządkowane według wyzwań.
        </p>
      </div>

      <LoadState
        loading={loading || waitingForTaxonomy}
        error={error}
        onRetry={reload}
        label="Wczytujemy wiedzę o wyzwaniach…"
      >
        {taxonomyError && (
          <Alert tone="warning">Nie udało się wczytać listy wyzwań. Pokazujemy wszystkie wpisy razem.</Alert>
        )}
        <div className="knowledge-sections">
          {challenges.map((t) => {
            const cards = byCategory.get(t.code) ?? [];
            const headingId = `wyzwanie-${t.code.toLowerCase()}`;
            return (
              <section key={t.code} className="ds-stack" aria-labelledby={headingId}>
                <h2 id={headingId}>{t.label_pl}</h2>
                {t.description && <p className="knowledge-description">{t.description}</p>}
                {cards.length > 0 ? (
                  <ul className="ds-grid card-list">
                    {cards.map((card) => (
                      <li key={card.id}>
                        <SolutionCard card={card} headingLevel={3} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Nie mamy jeszcze opracowań o tym wyzwaniu.{" "}
                    <Link to={`/rozwiazania?category=${encodeURIComponent(t.code)}`}>
                      Szukaj rozwiązań<span className="ds-sr-only">: {t.label_pl}</span>
                    </Link>
                  </p>
                )}
              </section>
            );
          })}
          {other.length > 0 && (
            <section className="ds-stack" aria-labelledby="wyzwanie-pozostale">
              <h2 id="wyzwanie-pozostale">{challenges.length > 0 ? "Pozostałe opracowania" : "Opracowania"}</h2>
              <ul className="ds-grid card-list">
                {other.map((card) => (
                  <li key={card.id}>
                    <SolutionCard card={card} headingLevel={3} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </LoadState>

      <p className="knowledge-cta">
        Masz konkretny problem? <Link to="/">Opisz go, a znajdziemy rozwiązania.</Link>
      </p>
    </div>
  );
}
