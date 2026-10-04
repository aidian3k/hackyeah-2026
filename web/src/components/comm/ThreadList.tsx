import { Link } from "react-router-dom";
import type { ThreadKind, ThreadListItem } from "@/api/comm";
import { chatTime, THREAD_KIND_LABELS, threadStatusLabel, type Viewer } from "@/lib/comm";
import { formatDateTime } from "@/lib/format";

interface Props {
  items: ThreadListItem[];
  hrefFor(item: ThreadListItem): string;
  viewer: Viewer;
}

const KIND_ICON: Record<ThreadKind, { tone: string; path: string }> = {
  // dymek ze znakiem zapytania
  QUESTION: {
    tone: "bg-soft-blue text-navy",
    path: "M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.4 5.1 3.7 6.7L5 22l4.5-2.6c.8.2 1.6.3 2.5.3 5.5 0 10-3.9 10-8.7S17.5 2 12 2zm1 14h-2v-2h2v2zm1.6-5.4-.8.8c-.6.6-.8 1-.8 2.1h-2v-.4c0-1 .3-1.8 1-2.4l1.1-1.1c.3-.3.5-.7.5-1.1 0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5h-2a3.5 3.5 0 1 1 7 0c0 .8-.4 1.6-1 2.1z",
  },
  // osoba
  MENTORING: {
    tone: "bg-soft-green text-ink",
    path: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z",
  },
  // dwa połączone ogniwa
  PARTNERSHIP: {
    tone: "bg-soft-yellow text-ink",
    path: "M10.6 13.4a1 1 0 0 1 0-1.4l3-3a3 3 0 0 1 4.2 4.2l-2.3 2.3-1.4-1.4 2.3-2.3a1 1 0 0 0-1.4-1.4l-3 3a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3 3a3 3 0 0 1-4.2-4.2l2.3-2.3 1.4 1.4-2.3 2.3a1 1 0 0 0 1.4 1.4l3-3a1 1 0 0 1 1.4 0z",
  },
};

/**
 * Lista rozmów jak w komunikatorze: ikona rodzaju, temat (pogrubiony przy nowej odpowiedzi),
 * rodzaj i status pod spodem, czas ostatniej wiadomości po prawej.
 */
export function ThreadList({ items, hrefFor, viewer }: Props) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {items.map((t) => {
        const unread = viewer === "author" && t.has_reply;
        const icon = KIND_ICON[t.kind];
        return (
          <li key={t.id} className="border-0 border-b border-solid border-line last:border-b-0">
            <Link
              to={hrefFor(t)}
              className="flex items-center gap-3 rounded-md px-2 py-3 text-ink no-underline hover:bg-surface-muted"
            >
              <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-pill ${icon.tone}`}>
                <svg viewBox="0 0 24 24" focusable="false" className="h-6 w-6 fill-current">
                  <path d={icon.path} />
                </svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={`truncate text-body-lg ${unread ? "font-bold" : ""}`}>{t.subject}</span>
                <span className="truncate text-small text-ink-muted">
                  {THREAD_KIND_LABELS[t.kind]} · {threadStatusLabel(t.status, viewer)}
                  {viewer !== "author" && t.assigned_mentor && ` · Ekspert: ${t.assigned_mentor.display_name}`}
                  {viewer !== "author" && t.category_label_pl && ` · ${t.category_label_pl}`}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-small text-ink-muted">
                <time dateTime={t.last_message_at} title={formatDateTime(t.last_message_at)}>
                  {chatTime(t.last_message_at)}
                </time>
                {unread && <span className="ds-badge">Nowa odpowiedź</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
