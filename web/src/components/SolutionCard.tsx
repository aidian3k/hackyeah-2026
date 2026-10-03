import { Link } from "react-router-dom";
import type { SolutionCard as SolutionCardData } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { firstVideo, youtubeThumbUrl } from "@/lib/media";
import "@/styles/components.css";

interface Props {
  card: SolutionCardData;
  headingLevel?: 2 | 3;
  /** Czat: numer karty w rogu, ten sam co cytowanie [n]. */
  showRank?: boolean;
  /** id elementu (cel odnośnika cytowania). */
  id?: string;
}

function place(gmina: string | null, powiat: string | null): string | null {
  if (gmina && powiat) return `${gmina} (powiat ${powiat})`;
  if (gmina) return gmina;
  if (powiat) return `powiat ${powiat}`;
  return null;
}

/** Jeden kształt karty w całym interfejsie (czat, biblioteka, panel). Puste pola są pomijane; scores nie są pokazywane. */
export function SolutionCard({ card, headingLevel = 3, showRank = false, id }: Props) {
  const Heading = `h${headingLevel}` as const;
  const href = `/rozwiazania/${card.id}`;
  const video = firstVideo(card.media);
  const origin = [card.organization, place(card.gmina, card.powiat)].filter(Boolean).join(" · ");

  return (
    <article className="ds-card ds-stack solution-card" id={id}>
      {showRank && (
        <span className="ds-rank" role="img" aria-label={`Rozwiązanie numer ${card.rank}`}>
          {card.rank}
        </span>
      )}
      {video && (
        // Miniatura powtarza link z tytułu — poza kolejnością Tab i drzewem dostępności;
        // informację o filmie dla czytników niesie tekst pod tytułem.
        <Link to={href} className="ds-card__media" tabIndex={-1} aria-hidden="true">
          <img src={youtubeThumbUrl(video.id)} alt="" loading="lazy" />
          <span className="ds-card__media-label">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
            Film o rozwiązaniu
          </span>
        </Link>
      )}
      {card.category && (
        <div>
          <CategoryTag code={card.category} label={card.category_label_pl} />
        </div>
      )}
      <Heading className="solution-card__title">
        <Link to={href}>{card.title}</Link>
      </Heading>
      {video && <p className="ds-sr-only">Na stronie rozwiązania jest film.</p>}
      {origin && <p className="solution-card__origin">{origin}</p>}
      {card.summary && <p className="solution-card__summary">{card.summary}</p>}
      <dl className="ds-meta ds-meta--small">
        {card.target_group && (
          <div className="ds-meta__item">
            <dt>Dla kogo</dt>
            <dd>{card.target_group}</dd>
          </div>
        )}
        {card.cost_range && (
          <div className="ds-meta__item">
            <dt>Koszt</dt>
            <dd>{card.cost_range}</dd>
          </div>
        )}
        <div className="ds-meta__item">
          <dt>Poziom sprawdzenia</dt>
          <dd>
            <EvidenceBadge level={card.evidence_level} withLabel={false} />
          </dd>
        </div>
      </dl>
      {card.origin === "USER_SUBMITTED" && <p className="solution-card__note">Zgłoszone przez użytkownika</p>}
    </article>
  );
}
