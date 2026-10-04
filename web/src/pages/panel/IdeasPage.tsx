import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { IdeaHubStatus, IdeaListItem, Page } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { IdeaStatusLabel } from "@/components/idea/IdeaStatusCard";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate, formatDateTime, plural } from "@/lib/format";
import { IDEA_STAGE_LABELS } from "@/lib/labels";

const PAGE_SIZE = 20;

type StatusFilter = IdeaHubStatus | "all";

const STATUS_TABS: { value: StatusFilter; label: string; empty: string }[] = [
  { value: "SUBMITTED", label: "Wysłane", empty: "Nie ma nowych pomysłów." },
  { value: "IN_REVIEW", label: "W analizie", empty: "Nie ma pomysłów w analizie." },
  { value: "INVITED", label: "Zaproszone", empty: "Nie ma pomysłów zaproszonych do dalszych prac." },
  { value: "REJECTED", label: "Odrzucone", empty: "Nie ma odrzuconych pomysłów." },
  { value: "all", label: "Wszystkie", empty: "Nikt jeszcze nie wysłał pomysłu do Hubu." },
];

function parseStatus(raw: string | null): StatusFilter {
  return STATUS_TABS.find((t) => t.value === raw)?.value ?? "SUBMITTED";
}

function parseOffset(raw: string | null): number {
  const n = raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(n) ? n : 0;
}

/** Data w kolumnie „Data”: wysłania do Hubu, a dla szkicu utworzenia. */
function ideaDate(idea: IdeaListItem): string {
  return idea.submitted_at ?? idea.created_at;
}

/**
 * Znacznik nowego pomysłu (status SUBMITTED): kształt (pigułka z kropką) + słowo, nie tylko kolor.
 * Używa go też skrzynka „Nowe” (sekcja „Nowe pomysły”).
 */
export function NewIdeaMarker() {
  return (
    <span className="ds-badge gap-1">
      <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false" className="h-2 w-2 fill-current">
        <circle cx="5" cy="5" r="5" />
      </svg>
      Nowy
    </span>
  );
}

/** Status w liście: „Nowy” dla wysłanych, dla pozostałych ikona i słowo. */
function IdeaListStatus({ idea }: { idea: IdeaListItem }) {
  return idea.status === "SUBMITTED" ? <NewIdeaMarker /> : <IdeaStatusLabel status={idea.status} />;
}

function place(idea: IdeaListItem): string {
  if (!idea.gmina) return "Nie podano";
  return idea.powiat ? `${idea.gmina} (pow. ${idea.powiat})` : idea.gmina;
}

/** Tabela na szerokim ekranie (od md). */
function IdeasTable({ items, caption }: { items: IdeaListItem[]; caption: string }) {
  return (
    // Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="ds-table-wrap hidden md:block" role="region" aria-labelledby="ideas-caption" tabIndex={0}>
      <table className="ds-table">
        <caption id="ideas-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Pomysł</th>
            <th scope="col">Etap</th>
            <th scope="col">Wyzwanie</th>
            <th scope="col">Gmina</th>
            <th scope="col" className="ds-table__num">
              Kanwa
            </th>
            <th scope="col" className="ds-table__num">
              Odpowiedzi
            </th>
            <th scope="col">Data</th>
          </tr>
        </thead>
        <tbody>
          {items.map((idea) => (
            <tr key={idea.id}>
              <td>
                <span className="flex flex-col items-start gap-1">
                  <Link to={`/panel/pomysly/${idea.id}`} className="[overflow-wrap:anywhere]">
                    {idea.title}
                  </Link>
                  <span className="text-small text-ink-muted">nr {idea.id}</span>
                  <IdeaListStatus idea={idea} />
                </span>
              </td>
              <td>{IDEA_STAGE_LABELS[idea.stage]}</td>
              <td>
                {idea.category && idea.category_label_pl ? (
                  <CategoryTag code={idea.category} label={idea.category_label_pl} />
                ) : (
                  "Nie przypisano"
                )}
              </td>
              <td>{place(idea)}</td>
              <td className="ds-table__num">{Math.round(idea.canvas_percent)}%</td>
              <td className="ds-table__num">{idea.reply_count}</td>
              <td>
                <time dateTime={ideaDate(idea)} title={formatDateTime(ideaDate(idea))}>
                  {formatDate(ideaDate(idea))}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Karty na wąskim ekranie (poniżej md) — te same dane co w tabeli. */
function IdeasCards({ items }: { items: IdeaListItem[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0 md:hidden" aria-label="Pomysły">
      {items.map((idea) => (
        <li key={idea.id}>
          <article className="ds-card flex flex-col gap-3" aria-labelledby={`idea-card-${idea.id}`}>
            <div className="flex flex-col items-start gap-1">
              <h3 id={`idea-card-${idea.id}`} className="m-0 font-sans text-h3 text-navy [overflow-wrap:anywhere]">
                <Link to={`/panel/pomysly/${idea.id}`}>{idea.title}</Link>
              </h3>
              <IdeaListStatus idea={idea} />
            </div>
            <dl className="ds-meta ds-meta--small m-0">
              <div className="ds-meta__item">
                <dt>Etap</dt>
                <dd>{IDEA_STAGE_LABELS[idea.stage]}</dd>
              </div>
              <div className="ds-meta__item">
                <dt>Wyzwanie</dt>
                <dd>
                  {idea.category && idea.category_label_pl ? (
                    <CategoryTag code={idea.category} label={idea.category_label_pl} />
                  ) : (
                    "Nie przypisano"
                  )}
                </dd>
              </div>
              <div className="ds-meta__item">
                <dt>Gmina</dt>
                <dd>{place(idea)}</dd>
              </div>
              <div className="ds-meta__item">
                <dt>Kanwa</dt>
                <dd>{Math.round(idea.canvas_percent)}%</dd>
              </div>
              <div className="ds-meta__item">
                <dt>Odpowiedzi</dt>
                <dd>{idea.reply_count}</dd>
              </div>
              <div className="ds-meta__item">
                <dt>Data</dt>
                <dd>
                  <time dateTime={ideaDate(idea)}>{formatDate(ideaDate(idea))}</time>
                </dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Panel: pomysły wysłane do Hubu (filtr statusu w adresie: ?status=…&offset=…, domyślnie „Wysłane”). */
export function PanelIdeasPage() {
  useDocumentTitle("Panel: Pomysły");
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get("status"));
  const offset = parseOffset(params.get("offset"));
  const tab = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0]!;

  const { data, error, loading, reload } = useApi<Page<IdeaListItem>>(
    () => api.ideas({ status: status === "all" ? null : status, limit: PAGE_SIZE, offset }),
    [status, offset],
  );

  function update(next: { status?: StatusFilter; offset?: number }) {
    const s = next.status ?? status;
    const o = next.offset ?? 0;
    const p = new URLSearchParams();
    if (s !== "SUBMITTED") p.set("status", s);
    if (o > 0) p.set("offset", String(o));
    setParams(p);
  }

  const caption = `Pomysły: ${tab.label.toLowerCase()}`;

  return (
    <div className="ds-page">
      <header className="flex max-w-3xl flex-col gap-3">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          Pomysły
        </h1>
        <p className="m-0 text-body-lg text-ink">
          Pomysły mieszkańców i organizacji wysłane do Hubu. Nowe są na górze listy.
        </p>
      </header>

      <div className="flex flex-col gap-2" role="group" aria-labelledby="ideas-status-label">
        <p id="ideas-status-label" className="ds-label m-0">
          Pokaż pomysły
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className="ds-chip"
              aria-pressed={status === t.value}
              onClick={() => update({ status: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="ideas-results">
        <h2 id="ideas-results" className="m-0 font-sans text-h2 text-navy">
          {tab.label}
        </h2>
        <LoadState loading={loading && !data} error={error} onRetry={reload} label="Wczytujemy pomysły…">
          {data && (
            <>
              <p className="m-0 text-body text-ink" aria-live="polite">
                {data.total} {plural(data.total, "pomysł", "pomysły", "pomysłów")}
              </p>
              {data.items.length === 0 ? (
                <EmptyState title={tab.empty}>
                  {status === "SUBMITTED" && (
                    <p>Pomysły wysłane z Kreatora pomysłów pojawią się tutaj same.</p>
                  )}
                </EmptyState>
              ) : (
                <>
                  <IdeasTable items={data.items} caption={caption} />
                  <IdeasCards items={data.items} />
                </>
              )}
              <Pagination
                total={data.total}
                limit={data.limit}
                offset={data.offset}
                onChange={(o) => update({ offset: o })}
              />
            </>
          )}
        </LoadState>
      </section>
    </div>
  );
}
