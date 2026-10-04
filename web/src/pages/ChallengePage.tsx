import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { SolutionCard as SolutionCardData } from "@/api/types";
import { Alert } from "@/components/Alert";
import { KeyFacts } from "@/components/knowledge/KeyFacts";
import { PowiatTileMap } from "@/components/knowledge/PowiatTileMap";
import { ZasobnikHeader } from "@/components/layout/ZasobnikHeader";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { firstVideo } from "@/lib/media";

function CardGrid({ cards, visual = false }: { cards: SolutionCardData[]; visual?: boolean }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.id} className="flex min-w-0">
          <SolutionCard card={card} headingLevel={3} visual={visual} />
        </li>
      ))}
    </ul>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="m-0 font-sans text-h2 text-navy">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Strona wyzwania: fakty ze źródłami, raporty, „Co już działa” (z filmem), materiały i jedno wezwanie do działania. */
export function ChallengePage() {
  const { code = "" } = useParams();
  const { data, error, loading, reload } = useApi(() => api.challenge(code), [code]);
  useDocumentTitle(data?.label_pl ?? "Wyzwanie");

  if (error?.status === 404) {
    return (
      <div className="ds-page">
        <div className="flex flex-col gap-3">
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Nie znaleźliśmy tego wyzwania
          </h1>
          <p className="m-0">Adres może być nieaktualny albo zawierać literówkę.</p>
          <p className="m-0">
            <Link to="/wiedza">Wróć do wiedzy o wyzwaniach</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ds-page">
        <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy wyzwanie…" />
      </div>
    );
  }

  const spotlight = data.solutions.map((s) => ({ card: s, video: firstVideo(s.media) })).find((x) => x.video);
  const moreSolutions = data.solutions_count > data.solutions.length;

  return (
    <div className="ds-page">
      <div className="flex flex-col gap-8">
        <ZasobnikHeader
          title={data.label_pl}
          lead={data.lead_pl ?? "Opis tego wyzwania jest w przygotowaniu."}
          stats={[
            { value: data.solutions_count, label: "innowacji w Bibliotece" },
            { value: data.knowledge_count, label: "opracowań i materiałów" },
          ]}
        />

        {data.key_facts.length > 0 ? (
          <Section id="fakty" title="Najważniejsze fakty">
            <KeyFacts facts={data.key_facts} isDemo={data.is_demo} />
          </Section>
        ) : (
          data.is_demo && (
            <Alert tone="info">
              Nie mamy jeszcze zweryfikowanych liczb o tym wyzwaniu. Gdy się pojawią, zobaczysz je tutaj razem ze źródłami.
            </Alert>
          )
        )}

        {data.indicators.length > 0 && (
          <Section id="mapa" title="Jak to wygląda w powiatach">
            <PowiatTileMap indicators={data.indicators} />
          </Section>
        )}

        {data.reports.length > 0 && (
          <Section id="raporty" title="Raporty i diagnozy">
            <CardGrid cards={data.reports} />
          </Section>
        )}

        <Section id="dziala" title="Co już działa">
          {data.solutions.length === 0 ? (
            <p className="m-0">
              Biblioteka nie ma jeszcze rozwiązań dla tego wyzwania.{" "}
              <Link to="/mam-pomysl">Zgłoś pomysł</Link>
            </p>
          ) : (
            <>
              {spotlight?.video && (
                <div className="max-w-3xl">
                  <VideoEmbed videoId={spotlight.video.id} title={spotlight.card.title} />
                </div>
              )}
              <CardGrid cards={data.solutions} visual />
              {moreSolutions && (
                <p className="m-0">
                  <Link to={`/rozwiazania?category=${encodeURIComponent(data.code)}`}>
                    Zobacz wszystkie innowacje ({data.solutions_count})
                    <span className="ds-sr-only">: {data.label_pl}</span>
                  </Link>
                </p>
              )}
            </>
          )}
        </Section>

        {data.materials.length > 0 && (
          <Section id="materialy" title="Materiały">
            <CardGrid cards={data.materials} />
          </Section>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className="m-0 text-body-lg">Masz taki problem u siebie? Opisz go, a znajdziemy rozwiązania.</p>
          <p className="m-0">
            <Link to="/" className="ds-btn ds-btn--cta">
              Opisz problem w swojej okolicy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
