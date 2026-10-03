import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { MediaItem, SolutionDetail } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { LoadState } from "@/components/LoadState";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ImplementationSteps } from "@/components/solution/ImplementationSteps";
import { MediaList } from "@/components/solution/MediaList";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { youtubeId } from "@/lib/media";
import "@/styles/solution.css";

const NOT_FOUND_TITLE = "Nie znaleźliśmy tego rozwiązania";

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function place(gmina: string | null, powiat: string | null): string | null {
  if (gmina && powiat) return `${gmina} (powiat ${powiat})`;
  if (gmina) return gmina;
  if (powiat) return `powiat ${powiat}`;
  return null;
}

interface BodyPart {
  heading: string | null;
  paragraphs: string[];
}

/**
 * Opis jako czysty tekst: akapity rozdzielone pustą linią. Linia „## …” na początku bloku
 * otwiera śródtytuł (h3 pod „Opis”); kolejne akapity należą do niego. Żadnego HTML z treści.
 */
function parseBody(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (!block) continue;
    const [first = "", ...rest] = block.split("\n");
    const title = /^#{1,6}\s+(.+)$/.exec(first.trim())?.[1];
    if (title) {
      const text = rest.join("\n").trim();
      parts.push({ heading: title.replace(/#+\s*$/, "").trim(), paragraphs: text ? [text] : [] });
    } else {
      const last = parts[parts.length - 1];
      if (last) last.paragraphs.push(block);
      else parts.push({ heading: null, paragraphs: [block] });
    }
  }
  return parts;
}

/** Filmy YouTube z poprawnym id (osadzane na stronie) i reszta materiałów (lista linków). */
function splitMedia(media: MediaItem[]): { videos: { item: MediaItem; id: string }[]; others: MediaItem[] } {
  const videos: { item: MediaItem; id: string }[] = [];
  const others: MediaItem[] = [];
  for (const item of media) {
    const id = item.type === "video" ? youtubeId(item.url) : null;
    if (id) videos.push({ item, id });
    else others.push(item);
  }
  return { videos, others };
}

export function SolutionPage() {
  const params = useParams();
  const id = parseId(params.id);
  const { data, error, loading, reload } = useApi<SolutionDetail>(
    () =>
      id === null
        ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono rozwiązania."))
        : api.solution(id),
    [id],
  );
  const notFound = error?.status === 404;

  const heading = data ? data.title : notFound ? NOT_FOUND_TITLE : "Rozwiązanie";
  useDocumentTitle(data ? data.title : notFound ? NOT_FOUND_TITLE : "Rozwiązanie");

  const isKnowledge = data?.kind === "KNOWLEDGE";
  const origin = data ? [data.organization, place(data.gmina, data.powiat)].filter(Boolean).join(" · ") : "";

  return (
    <div className="ds-page solution-page">
      <header className="solution-head ds-stack">
        {data && (
          <nav aria-label="Jesteś tutaj" className="breadcrumbs">
            <ol className="breadcrumbs__list">
              <li>
                {isKnowledge ? <Link to="/wiedza">Wiedza</Link> : <Link to="/rozwiazania">Biblioteka innowacji</Link>}
              </li>
              <li>
                <span aria-current="page">{data.title}</span>
              </li>
            </ol>
          </nav>
        )}
        {data && <p className="solution-head__eyebrow">{isKnowledge ? "Wiedza o problemie" : "Rozwiązanie"}</p>}
        <h1 tabIndex={-1}>{heading}</h1>
        {data && (
          <>
            {data.category && (
              <div>
                <CategoryTag code={data.category} label={data.category_label_pl} />
              </div>
            )}
            {origin && <p className="solution-head__origin">{origin}</p>}
            {!isKnowledge && (
              <p className="solution-head__evidence">
                <EvidenceBadge level={data.evidence_level} />
              </p>
            )}
            {data.origin === "USER_SUBMITTED" && (
              <p className="solution-head__note">Zgłoszone przez użytkownika</p>
            )}
          </>
        )}
      </header>

      {notFound ? (
        <div role="status">
          <EmptyState title="Ten adres nie prowadzi do żadnego wpisu.">
            <p>
              Możliwe, że link jest niepełny albo wpis został wycofany.{" "}
              <Link to="/rozwiazania">Przejdź do Biblioteki innowacji</Link>
            </p>
          </EmptyState>
        </div>
      ) : (
        <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy rozwiązanie…">
          {data && <SolutionContent data={data} />}
        </LoadState>
      )}
    </div>
  );
}

function SolutionContent({ data }: { data: SolutionDetail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isKnowledge = data.kind === "KNOWLEDGE";
  const { videos, others } = splitMedia(data.media);
  const body = parseBody(data.body ?? "");
  const steps = isKnowledge ? [] : data.implementation_steps.filter((s) => s.trim());
  const cost = isKnowledge ? null : data.cost_range;
  const tags = data.tags.map((t) => t.trim()).filter(Boolean);
  const materials = others.filter((m) => m.url);
  // Wejście z innej strony aplikacji → wracamy historią; wejście z linku → do listy.
  const hasHistory = location.key !== "default";
  const listPath = isKnowledge ? "/wiedza" : "/rozwiazania";

  return (
    <>
      {videos.length > 0 && (
        <section className="ds-stack" aria-labelledby="solution-video">
          <h2 id="solution-video">{isKnowledge ? "Film" : "Film o rozwiązaniu"}</h2>
          {videos.map((v, i) => (
            <VideoEmbed
              key={`${v.id}-${i}`}
              videoId={v.id}
              title={videos.length > 1 ? `${data.title} (część ${i + 1})` : data.title}
            />
          ))}
        </section>
      )}

      {data.summary && (
        <section className="ds-stack" aria-labelledby="solution-summary">
          <h2 id="solution-summary">W skrócie</h2>
          <p className="solution-page__lead">{data.summary}</p>
        </section>
      )}

      {body.length > 0 && (
        <section className="ds-stack solution-body" aria-labelledby="solution-body">
          <h2 id="solution-body">Opis</h2>
          {body.map((part, i) =>
            part.heading ? (
              <div key={i} className="ds-stack solution-body__part">
                <h3>{part.heading}</h3>
                {part.paragraphs.map((t, j) => (
                  <p key={j} className="solution-body__text">
                    {t}
                  </p>
                ))}
              </div>
            ) : (
              part.paragraphs.map((t, j) => (
                <p key={`${i}-${j}`} className="solution-body__text">
                  {t}
                </p>
              ))
            ),
          )}
        </section>
      )}

      {data.target_group && (
        <section className="ds-stack" aria-labelledby="solution-target">
          <h2 id="solution-target">Dla kogo</h2>
          <p>{data.target_group}</p>
        </section>
      )}

      {cost && (
        <section className="ds-stack" aria-labelledby="solution-cost">
          <h2 id="solution-cost">Koszt</h2>
          <p>{cost}</p>
        </section>
      )}

      {steps.length > 0 && (
        <section className="ds-stack" aria-labelledby="solution-steps">
          <h2 id="solution-steps">Jak to wdrożyć</h2>
          <ImplementationSteps steps={steps} />
        </section>
      )}

      {materials.length > 0 && (
        <section className="ds-stack" aria-labelledby="solution-materials">
          <h2 id="solution-materials">Materiały</h2>
          <MediaList items={materials} />
        </section>
      )}

      {(data.source_name || data.source_url) && (
        <section className="ds-stack" aria-labelledby="solution-source">
          <h2 id="solution-source">Źródło</h2>
          {data.source_name && <p>{data.source_name}</p>}
          {data.source_url && (
            <p>
              <a href={data.source_url} target="_blank" rel="noopener noreferrer" className="solution-page__ext">
                Zobacz opis u źródła
              </a>{" "}
              <span className="solution-page__hint">(otwiera stronę zewnętrzną w nowej karcie)</span>
            </p>
          )}
        </section>
      )}

      {tags.length > 0 && (
        <section className="ds-stack" aria-labelledby="solution-tags">
          <h2 id="solution-tags">Tematy</h2>
          <p>{tags.join(", ")}</p>
        </section>
      )}

      <div className="ds-cluster solution-page__actions">
        {hasHistory ? (
          <button type="button" className="ds-btn ds-btn--link" onClick={() => navigate(-1)}>
            Wróć do wyników
          </button>
        ) : (
          <Link className="ds-btn ds-btn--link" to={listPath}>
            {isKnowledge ? "Przejdź do Wiedzy" : "Przejdź do Biblioteki innowacji"}
          </Link>
        )}
        {data.category && (
          <Link className="ds-btn" to={`/rozwiazania?category=${encodeURIComponent(data.category)}`}>
            Szukaj podobnych rozwiązań
          </Link>
        )}
      </div>
    </>
  );
}
