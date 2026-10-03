import { Link } from "react-router-dom";
import type { SolutionCard } from "@/api/types";
import { firstVideo, youtubeThumbUrl } from "@/lib/media";
import { ropsGroup } from "@/lib/ropsGroups";

interface Props {
  /** Pierwsze innowacje z filmem (już ograniczone limitem). */
  videos: SolutionCard[];
  /** Wszystkie innowacje z filmem w Bibliotece. */
  total: number;
  /** Włącza filtr „Tylko z filmem”. */
  onShowAll(): void;
}

/** „Obejrzyj, jak to działa”: innowacje z filmem jako duże kafelki (miniatura, tytuł, grupa). */
export function FilmStrip({ videos, total, onShowAll }: Props) {
  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="film-strip" className="flex flex-col gap-4 rounded-lg bg-surface-muted p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="film-strip" className="m-0 font-sans text-h2 text-navy">
          Obejrzyj, jak to działa
        </h2>
        <button type="button" className="ds-btn ds-btn--link px-0" onClick={onShowAll}>
          Wszystkie innowacje z filmem ({total})
        </button>
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((card) => {
          const video = firstVideo(card.media);
          const group = ropsGroup(card.tags);
          return (
            <li key={card.id} className="relative flex flex-col gap-2">
              {video && (
                <div className="ds-card__media" aria-hidden="true">
                  <img src={youtubeThumbUrl(video.id)} alt="" loading="lazy" />
                  <span className="ds-card__media-label">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                    Film
                  </span>
                </div>
              )}
              <h3 className="m-0 font-sans text-h3">
                <Link
                  to={`/rozwiazania/${card.id}`}
                  className="text-navy after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-[3px] focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
                >
                  {card.title}
                </Link>
              </h3>
              {group && <p className="m-0 text-small text-ink-muted">{group.label}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
