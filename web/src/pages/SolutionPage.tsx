import type { ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { MediaItem, SolutionDetail } from "@/api/types";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ImplementationSteps } from "@/components/solution/ImplementationSteps";
import { KeyInfo } from "@/components/solution/KeyInfo";
import { MediaList } from "@/components/solution/MediaList";
import { SimilarSolutions } from "@/components/solution/SimilarSolutions";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { youtubeId } from "@/lib/media";
import { MODULE_NAMES } from "@/lib/modules";
import { projectName, ropsGroup } from "@/lib/ropsGroups";

const NOT_FOUND_TITLE = "Nie znaleźliśmy tego rozwiązania";

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
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

const KNOWLEDGE_TYPE_LABELS = { REPORT: "Raport", MATERIAL: "Materiał" } as const;

function kindLabel(data: SolutionDetail): string {
  if (data.kind !== "KNOWLEDGE") return "Innowacja";
  return data.knowledge_type ? KNOWLEDGE_TYPE_LABELS[data.knowledge_type] : "Wiedza";
}

function crumbs(data: SolutionDetail): Crumb[] {
  const section: Crumb =
    data.kind !== "KNOWLEDGE"
      ? { label: "Biblioteka innowacji", to: "/rozwiazania" }
      : data.knowledge_type === "MATERIAL"
        ? { label: "Materiały", to: "/wiedza/materialy" }
        : { label: "Wiedza o wyzwaniach", to: "/wiedza" };
  return [{ label: MODULE_NAMES.zasobnik, to: "/wiedza" }, section, { label: data.title }];
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
  const group = data ? ropsGroup(data.tags) : null;
  const subtitle = data ? [data.organization, projectName(data.tags)].filter(Boolean).join(" · ") : "";

  return (
    <div className="ds-page [overflow-wrap:anywhere]">
      <header className="flex max-w-3xl flex-col gap-3">
        {data && <Breadcrumbs items={crumbs(data)} />}
        {data && <p className="m-0 font-sans text-label text-ink-muted">{kindLabel(data)}</p>}
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          {heading}
        </h1>
        {data && (
          <>
            <div className="flex flex-wrap gap-2">
              {!isKnowledge && group && <span className="ds-tag">{group.label}</span>}
              {data.category && <CategoryTag code={data.category} label={data.category_label_pl} />}
            </div>
            {subtitle && <p className="m-0 text-body text-ink">{subtitle}</p>}
            {data.origin === "USER_SUBMITTED" && (
              <p className="m-0 text-small text-ink-muted">Zgłoszone przez użytkownika</p>
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

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="m-0 font-sans text-h2 text-navy">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SolutionContent({ data }: { data: SolutionDetail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isKnowledge = data.kind === "KNOWLEDGE";
  const { videos, others } = splitMedia(data.media);
  const body = parseBody(data.body ?? "");
  const steps = isKnowledge ? [] : data.implementation_steps.filter((s) => s.trim());
  const group = ropsGroup(data.tags);
  const topics = data.tags
    .map((t) => t.trim())
    .filter((t) => t && t !== group?.tag && !t.startsWith("Projekt: "));
  const downloads = others.filter((m) => m.url);
  // Wejście z innej strony aplikacji → wracamy historią; wejście z linku → do listy.
  const hasHistory = location.key !== "default";
  const listPath = isKnowledge
    ? data.knowledge_type === "MATERIAL"
      ? "/wiedza/materialy"
      : "/wiedza"
    : "/rozwiazania";

  return (
    <>
      {videos.length > 0 && (
        <section className="flex max-w-4xl flex-col gap-3" aria-labelledby="solution-video">
          <h2 id="solution-video" className="m-0 font-sans text-h2 text-navy">
            {isKnowledge ? "Film" : "Film o rozwiązaniu"}
          </h2>
          {videos.map((v, i) => (
            <VideoEmbed
              key={`${v.id}-${i}`}
              videoId={v.id}
              title={videos.length > 1 ? `${data.title} (część ${i + 1})` : data.title}
            />
          ))}
        </section>
      )}

      {/* Kolejność w DOM: „W skrócie”, opis, karta boczna. Na telefonie karta idzie zaraz po „W skrócie” (order). */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-x-8">
        {data.summary && (
          <div className="order-1 max-w-3xl lg:col-start-1 lg:row-start-1">
            <Section id="solution-summary" title="W skrócie">
              <p className="m-0 text-body-lg text-ink">{data.summary}</p>
            </Section>
          </div>
        )}

        <div className="order-3 flex max-w-3xl flex-col gap-8 lg:col-start-1 lg:row-start-2">
          {body.length > 0 && (
            <Section id="solution-body" title="Opis">
              {body.map((part, i) =>
                part.heading ? (
                  <div key={i} className="flex flex-col gap-2">
                    <h3 className="m-0 font-sans text-h3 text-navy">{part.heading}</h3>
                    {part.paragraphs.map((t, j) => (
                      <p key={j} className="m-0 whitespace-pre-line text-body text-ink">
                        {t}
                      </p>
                    ))}
                  </div>
                ) : (
                  part.paragraphs.map((t, j) => (
                    <p key={`${i}-${j}`} className="m-0 whitespace-pre-line text-body text-ink">
                      {t}
                    </p>
                  ))
                ),
              )}
            </Section>
          )}

          {steps.length > 0 && (
            <Section id="solution-steps" title="Jak to wdrożyć">
              <ImplementationSteps steps={steps} />
            </Section>
          )}

          {topics.length > 0 && (
            <Section id="solution-tags" title="Tematy">
              <p className="m-0 text-body text-ink">{topics.join(", ")}</p>
            </Section>
          )}
        </div>

        <aside
          aria-label="Informacje dodatkowe"
          className="order-2 flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <KeyInfo data={data} />
          {downloads.length > 0 && (
            <Section id="solution-materials" title="Do pobrania">
              <MediaList items={downloads} />
              <p className="m-0 text-small text-ink-muted">Linki otwierają zasoby zewnętrzne w tej samej karcie.</p>
            </Section>
          )}
        </aside>
      </div>

      {!isKnowledge && <SimilarSolutions current={data} />}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
        <Link className="ds-btn ds-btn--cta" to="/">
          Masz podobny problem? Opisz go
        </Link>
        {hasHistory ? (
          <button type="button" className="ds-btn ds-btn--link" onClick={() => navigate(-1)}>
            Wróć do wyników
          </button>
        ) : (
          <Link className="ds-btn ds-btn--link" to={listPath}>
            {isKnowledge ? "Przejdź do wiedzy o wyzwaniach" : "Przejdź do Biblioteki innowacji"}
          </Link>
        )}
      </div>
    </>
  );
}
