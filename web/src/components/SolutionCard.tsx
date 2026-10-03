import { Link } from "react-router-dom";
import type { SolutionCard as SolutionCardData } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { firstVideo, youtubeThumbUrl } from "@/lib/media";
import { GroupIcon, NEUTRAL_VISUAL, ropsGroup } from "@/lib/ropsGroups";

interface Props {
  card: SolutionCardData;
  headingLevel?: 2 | 3;
  /** Czat: numer karty w rogu, ten sam co cytowanie [n]. */
  showRank?: boolean;
  /** id elementu (cel odnośnika cytowania). */
  id?: string;
  /** Katalog: karta bez filmu dostaje kolorowy pasek grupy z ikoną (Zasobnik). Czat i panel — bez paska. */
  visual?: boolean;
}

function place(gmina: string | null, powiat: string | null): string | null {
  if (gmina && powiat) return `${gmina} (powiat ${powiat})`;
  if (gmina) return gmina;
  if (powiat) return `powiat ${powiat}`;
  return null;
}

/**
 * Jeden kształt karty w całym interfejsie (czat, biblioteka, panel). Cała karta jest klikalna przez
 * rozciągnięty link w tytule — jeden przystanek Tab. Puste pola są pomijane; scores nie są pokazywane.
 */
export function SolutionCard({ card, headingLevel = 3, showRank = false, id, visual = false }: Props) {
  const Heading = `h${headingLevel}` as const;
  const href = `/rozwiazania/${card.id}`;
  const video = firstVideo(card.media);
  const group = ropsGroup(card.tags);
  const origin = [card.organization, place(card.gmina, card.powiat)].filter(Boolean).join(" · ");
  // Wiedza i karty spoza Biblioteki ROPS pokazują wyzwanie; innowacje ROPS — grupę „dla kogo”.
  const showCategory = card.kind === "KNOWLEDGE" || !group;

  return (
    <article
      id={id}
      className="ds-card relative flex h-full flex-col gap-3 [overflow-wrap:anywhere] focus-within:shadow-card hover:shadow-card"
    >
      {showRank && (
        <span className="ds-rank" role="img" aria-label={`Rozwiązanie numer ${card.rank}`}>
          {card.rank}
        </span>
      )}

      {video ? (
        <div className="ds-card__media" aria-hidden="true">
          <img src={youtubeThumbUrl(video.id)} alt="" loading="lazy" />
          <span className="ds-card__media-label">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
            Film
          </span>
        </div>
      ) : (
        visual && (
          <div
            aria-hidden="true"
            className={`flex aspect-[16/9] items-center justify-center rounded-md ${(group ?? NEUTRAL_VISUAL).surfaceClass}`}
          >
            <GroupIcon group={group ?? NEUTRAL_VISUAL} className="h-14 w-14" />
          </div>
        )
      )}

      <div className="flex flex-wrap gap-2">
        {group && card.kind === "SOLUTION" && <span className="ds-tag">{group.label}</span>}
        {showCategory && <CategoryTag code={card.category} label={card.category_label_pl} />}
      </div>

      <Heading className="m-0 font-sans text-h3">
        <Link
          to={href}
          className="text-navy after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-[3px] focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
        >
          {card.title}
        </Link>
      </Heading>
      {video && <p className="ds-sr-only">Na stronie rozwiązania jest film.</p>}
      {origin && <p className="m-0 text-small text-ink-muted">{origin}</p>}
      {card.summary && <p className="m-0 line-clamp-3 text-body text-ink">{card.summary}</p>}
      {card.target_group && (
        <p className="m-0 mt-auto line-clamp-2 text-small text-ink">
          <span className="font-bold">Dla kogo: </span>
          {card.target_group}
        </p>
      )}
      {card.origin === "USER_SUBMITTED" && <p className="m-0 text-small text-ink-muted">Zgłoszone przez użytkownika</p>}
    </article>
  );
}
