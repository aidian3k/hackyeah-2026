import { useId, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { IdeaDetail, IdeaStatus } from "@/api/types";
import { formatDateTime, plural } from "@/lib/format";
import { IDEA_STAGE_LABELS, IDEA_STATUS_LABELS } from "@/lib/labels";

// Kształt ikony różni statusy niezależnie od koloru (tekst statusu jest zawsze obok).
const STATUS_ICONS: Record<IdeaStatus, ReactNode> = {
  // szkic: ołówek
  DRAFT: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  // wysłany: samolot papierowy
  SUBMITTED: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  // w analizie: zegar
  IN_REVIEW: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  // zaproszony: kółko z ptaszkiem
  INVITED: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
    </>
  ),
  // odrzucony: kółko z krzyżykiem
  REJECTED: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
};

export function IdeaStatusLabel({ status }: { status: IdeaStatus }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 flex-none fill-none stroke-current text-navy"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {STATUS_ICONS[status]}
      </svg>
      <span>{IDEA_STATUS_LABELS[status]}</span>
    </span>
  );
}

interface Props {
  idea: IdeaDetail;
  headingLevel?: 2 | 3;
}

/** Stan zapisanego pomysłu: status, etap, postęp kanwy i odnośniki (kanwa, odpowiedzi Hubu, wnioski). */
export function IdeaStatusCard({ idea, headingLevel = 2 }: Props) {
  const Heading = `h${headingLevel}` as const;
  const headingId = useId();
  const percent = Math.max(0, Math.min(100, Math.round(idea.canvas_percent)));
  const replies = idea.reply_count;

  return (
    <section aria-labelledby={headingId} className="ds-card flex flex-col gap-4">
      <Heading id={headingId} className="m-0 font-sans text-h3 text-navy">
        Pomysł nr {idea.id}
      </Heading>

      <dl className="m-0 flex flex-col gap-3">
        <div className="flex flex-col">
          <dt className="text-label text-ink">Status</dt>
          <dd className="m-0 text-body text-ink">
            <IdeaStatusLabel status={idea.status} />
            {idea.submitted_at && (
              <span className="block text-small text-ink-muted">
                Wysłano <time dateTime={idea.submitted_at}>{formatDateTime(idea.submitted_at)}</time>
              </span>
            )}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-label text-ink">Etap</dt>
          <dd className="m-0 text-body text-ink">{IDEA_STAGE_LABELS[idea.stage]}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-label text-ink">Social Canvas</dt>
          <dd className="m-0 flex flex-col gap-1 text-body text-ink">
            <span>Wypełniono {percent}% mapy</span>
            {/* ds-bar--navy ustawia tylko kolor wypełnienia (zmienna dziedziczona przez ścieżkę). */}
            <span className="ds-bar--navy" aria-hidden="true">
              <span className="ds-bar__track">
                <span className="ds-bar__fill" style={{ "--ds-bar-share": `${percent}%` } as CSSProperties} />
              </span>
            </span>
          </dd>
        </div>
        {idea.source_report_id !== null && (
          <div className="flex flex-col">
            <dt className="text-label text-ink">Zgłoszenie źródłowe</dt>
            <dd className="m-0 text-body text-ink">Zgłoszenie nr {idea.source_report_id}</dd>
          </div>
        )}
      </dl>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        <li>
          <Link to={`/mam-pomysl/${idea.id}/kanwa`}>Kanwa Social Canvas</Link>
        </li>
        <li>
          <Link to={`/moje-pomysly#pomysl-${idea.id}`}>
            Odpowiedzi Hubu ({replies} {plural(replies, "odpowiedź", "odpowiedzi", "odpowiedzi")})
          </Link>
        </li>
        {idea.applications.map((app) => (
          <li key={app.id}>
            <Link to={`/wnioski/${app.id}`}>Wniosek do naboru {app.call_id}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
