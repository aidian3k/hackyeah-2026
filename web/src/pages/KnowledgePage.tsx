import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { IndicatorMeta } from "@/api/types";
import { ChallengeTile } from "@/components/knowledge/ChallengeTile";
import { PowiatTileMap } from "@/components/knowledge/PowiatTileMap";
import { ZasobnikHeader } from "@/components/layout/ZasobnikHeader";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const KNOWLEDGE_PREVIEW_LIMIT = 4;

/** Wiedza o wyzwaniach: kafelki wyzwań z kluczowym faktem i podgląd materiałów. */
export function KnowledgePage() {
  useDocumentTitle("Wiedza o wyzwaniach");
  const challenges = useApi(() => api.challenges(), []);
  const indicators = useApi(() => api.indicators(), []);
  // Domyślny wskaźnik każdego wyzwania = pierwszy wg sort_order (API zwraca je posortowane);
  // kolejność na liście wyboru jak kolejność wyzwań.
  const defaults = (() => {
    const first = new Map<string, IndicatorMeta>();
    for (const i of indicators.data ?? []) if (!first.has(i.category)) first.set(i.category, i);
    return (challenges.data ?? []).flatMap((c) => first.get(c.code) ?? []);
  })();
  const materials = useApi(
    () => api.solutions({ kind: "KNOWLEDGE", knowledge_type: "MATERIAL", limit: KNOWLEDGE_PREVIEW_LIMIT }),
    [],
  );

  return (
    <div className="ds-page">
      <div className="flex flex-col gap-8">
        <ZasobnikHeader
          title="Wiedza o wyzwaniach Małopolski"
          lead="Diagnozy, dane i opracowania o najważniejszych wyzwaniach społecznych regionu — z linkami do źródeł i do rozwiązań, które już działają."
        />

        <section aria-labelledby="wyzwania" className="flex flex-col gap-4">
          <h2 id="wyzwania" className="m-0 font-sans text-h2 text-navy">
            Wyzwania
          </h2>
          <LoadState
            loading={challenges.loading}
            error={challenges.error}
            onRetry={challenges.reload}
            label="Wczytujemy wyzwania…"
          >
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {challenges.data?.map((c) => (
                <li key={c.code} className="flex min-w-0">
                  <ChallengeTile challenge={c} />
                </li>
              ))}
            </ul>
          </LoadState>
        </section>

        {defaults.length > 0 && (
          <section aria-labelledby="mapa" className="flex flex-col gap-4">
            <h2 id="mapa" className="m-0 font-sans text-h2 text-navy">
              Mapa wyzwań w powiatach
            </h2>
            <PowiatTileMap indicators={defaults} />
          </section>
        )}

        <section aria-labelledby="materialy" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="materialy" className="m-0 font-sans text-h2 text-navy">
              Materiały
            </h2>
            <Link to="/wiedza/materialy">Wszystkie materiały</Link>
          </div>
          <LoadState
            loading={materials.loading}
            error={materials.error}
            onRetry={materials.reload}
            label="Wczytujemy materiały…"
          >
            {materials.data && materials.data.items.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
                {materials.data.items.map((card) => (
                  <li key={card.id} className="flex min-w-0">
                    <SolutionCard card={card} headingLevel={3} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0">Nie ma jeszcze materiałów.</p>
            )}
          </LoadState>
        </section>

        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className="m-0 text-body-lg">Masz konkretny problem? Opisz go, a znajdziemy rozwiązania.</p>
          <p className="m-0">
            <Link to="/" className="ds-btn ds-btn--cta">
              Opisz swój problem
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
