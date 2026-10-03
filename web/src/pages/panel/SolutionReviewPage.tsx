import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { MediaItem, SolutionDetail } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ReviewActions } from "@/components/panel/ReviewActions";
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

/** Opis jako czysty tekst: bloki rozdzielone pustą linią, „## …” na początku bloku → śródtytuł h4. */
function bodyBlocks(body: string): { heading: string | null; text: string }[] {
  const out: { heading: string | null; text: string }[] = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (!block) continue;
    const [first = "", ...rest] = block.split("\n");
    const title = /^#{1,6}\s+(.+)$/.exec(first.trim())?.[1];
    if (title) out.push({ heading: title.replace(/#+\s*$/, "").trim(), text: rest.join("\n").trim() });
    else out.push({ heading: null, text: block });
  }
  return out;
}

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

/** Panel: przegląd pomysłu przed publikacją (pełna treść + korekta kategorii, poziomu i decyzja). */
export function SolutionReviewPage() {
  const params = useParams();
  const id = parseId(params.id);
  const { data, error, loading, reload } = useApi<SolutionDetail>(
    () =>
      id === null
        ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono rozwiązania."))
        : api.solution(id),
    [id],
  );
  // Odpowiedź PATCH zastępuje dane z GET (bez ponownego wczytywania i migania).
  const [updated, setUpdated] = useState<SolutionDetail | null>(null);
  const solution = updated && updated.id === id ? updated : data;
  const notFound = error?.status === 404;

  const heading = solution ? solution.title : notFound ? NOT_FOUND_TITLE : "Przegląd rozwiązania";
  useDocumentTitle(solution ? `Panel: ${solution.title}` : "Panel: Przegląd rozwiązania");

  return (
    <div className="ds-page solution-page">
      <header className="solution-head ds-stack">
        <nav aria-label="Jesteś tutaj" className="breadcrumbs">
          <ol className="breadcrumbs__list">
            <li>
              <Link to="/panel/rozwiazania">Do zatwierdzenia</Link>
            </li>
            <li>
              <span aria-current="page">{solution ? solution.title : "Przegląd rozwiązania"}</span>
            </li>
          </ol>
        </nav>
        <p className="solution-head__eyebrow">Przegląd rozwiązania</p>
        <h1 tabIndex={-1}>{heading}</h1>
        {solution && (
          <>
            {solution.category && (
              <div>
                <CategoryTag code={solution.category} label={solution.category_label_pl} />
              </div>
            )}
            <p className="solution-head__evidence">
              <EvidenceBadge level={solution.evidence_level} />
            </p>
            {solution.origin === "USER_SUBMITTED" && (
              <p className="solution-head__note">Zgłoszone przez użytkownika formularzem „Mam pomysł”</p>
            )}
          </>
        )}
      </header>

      {notFound ? (
        <div role="status">
          <EmptyState title="Ten adres nie prowadzi do żadnego rozwiązania.">
            <p>
              <Link to="/panel/rozwiazania">Wróć do listy „Do zatwierdzenia”</Link>
            </p>
          </EmptyState>
        </div>
      ) : (
        <LoadState loading={loading && !solution} error={error} onRetry={reload} label="Wczytujemy rozwiązanie…">
          {solution && (
            <>
              <section className="ds-card ds-stack" aria-labelledby="review-actions">
                <h2 id="review-actions">Przejrzyj i zdecyduj</h2>
                <ReviewActions key={solution.id} solution={solution} onUpdated={setUpdated} />
              </section>
              <ReviewContent solution={solution} />
            </>
          )}
        </LoadState>
      )}
    </div>
  );
}

function ReviewContent({ solution }: { solution: SolutionDetail }) {
  const { videos, others } = splitMedia(solution.media);
  const blocks = bodyBlocks(solution.body ?? "");
  const steps = solution.implementation_steps.filter((s) => s.trim());
  const tags = solution.tags.map((t) => t.trim()).filter(Boolean);
  const materials = others.filter((m) => m.url);
  const origin = [solution.organization, place(solution.gmina, solution.powiat)].filter(Boolean).join(" · ");

  return (
    <>
      <section className="ds-stack" aria-labelledby="review-card">
        <h2 id="review-card">Tak wygląda karta w bibliotece</h2>
        <SolutionCard card={solution} headingLevel={3} />
      </section>

      {origin && (
        <section className="ds-stack" aria-labelledby="review-origin">
          <h2 id="review-origin">Kto i gdzie</h2>
          <p>{origin}</p>
        </section>
      )}

      {videos.length > 0 && (
        <section className="ds-stack" aria-labelledby="review-video">
          <h2 id="review-video">Film o rozwiązaniu</h2>
          {videos.map((v, i) => (
            <VideoEmbed
              key={`${v.id}-${i}`}
              videoId={v.id}
              title={videos.length > 1 ? `${solution.title} (część ${i + 1})` : solution.title}
            />
          ))}
        </section>
      )}

      <section className="ds-stack" aria-labelledby="review-summary">
        <h2 id="review-summary">W skrócie</h2>
        <p className="solution-page__lead">{solution.summary}</p>
      </section>

      {blocks.length > 0 && (
        <section className="ds-stack solution-body" aria-labelledby="review-body">
          <h2 id="review-body">Opis</h2>
          {blocks.map((b, i) =>
            b.heading ? (
              <div key={i} className="ds-stack solution-body__part">
                <h3>{b.heading}</h3>
                {b.text && <p className="solution-body__text">{b.text}</p>}
              </div>
            ) : (
              <p key={i} className="solution-body__text">
                {b.text}
              </p>
            ),
          )}
        </section>
      )}

      {solution.target_group && (
        <section className="ds-stack" aria-labelledby="review-target">
          <h2 id="review-target">Dla kogo</h2>
          <p>{solution.target_group}</p>
        </section>
      )}

      {solution.cost_range && (
        <section className="ds-stack" aria-labelledby="review-cost">
          <h2 id="review-cost">Koszt</h2>
          <p>{solution.cost_range}</p>
        </section>
      )}

      {steps.length > 0 && (
        <section className="ds-stack" aria-labelledby="review-steps">
          <h2 id="review-steps">Jak to wdrożyć</h2>
          <ImplementationSteps steps={steps} />
        </section>
      )}

      {materials.length > 0 && (
        <section className="ds-stack" aria-labelledby="review-materials">
          <h2 id="review-materials">Materiały</h2>
          <MediaList items={materials} />
        </section>
      )}

      {solution.source_url && (
        <section className="ds-stack" aria-labelledby="review-source">
          <h2 id="review-source">Źródło</h2>
          {solution.source_name && <p>{solution.source_name}</p>}
          {/^https?:\/\//i.test(solution.source_url) ? (
            <p>
              <a href={solution.source_url} target="_blank" rel="noopener noreferrer">
                {solution.source_url}
              </a>{" "}
              <span className="solution-page__hint">
                (otwiera stronę zewnętrzną w nowej karcie; sprawdź adres przed publikacją)
              </span>
            </p>
          ) : (
            <p>
              {solution.source_url}{" "}
              <span className="solution-page__hint">(adres nie zaczyna się od http, nie jest linkiem)</span>
            </p>
          )}
        </section>
      )}

      {tags.length > 0 && (
        <section className="ds-stack" aria-labelledby="review-tags">
          <h2 id="review-tags">Tematy</h2>
          <p>{tags.join(", ")}</p>
        </section>
      )}
    </>
  );
}
