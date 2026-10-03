import type { Reply } from "@/api/types";
import { formatDateTime } from "@/lib/format";
import "@/styles/components.css";

interface Props {
  replies: Reply[];
  /** Poziom nagłówka pojedynczej odpowiedzi; domyślnie h3. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * Odpowiedzi zespołu Hubu. Autorem jest zawsze „Zespół Hubu”; author_label to tylko dopisek
 * w nawiasie, nigdy potwierdzona tożsamość (author_verified = false).
 */
export function ReplyList({ replies, headingLevel = 3 }: Props) {
  if (replies.length === 0) return null;
  const Heading = `h${headingLevel}` as const;
  return (
    <ol className="reply-list">
      {replies.map((r) => (
        <li key={r.id}>
          <article className="ds-card ds-stack reply" aria-labelledby={`reply-${r.id}-title`}>
            <div className="reply__head">
              <Heading id={`reply-${r.id}-title`} className="reply__title">
                Odpowiedź zespołu Hubu
              </Heading>
              <p className="reply__meta">
                <time dateTime={r.created_at}>{formatDateTime(r.created_at)}</time>
                {r.author_label && ` (podpisano: ${r.author_label})`}
              </p>
            </div>
            <p className="reply__body">{r.body}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
