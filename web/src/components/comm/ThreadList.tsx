import { Link } from "react-router-dom";
import type { ThreadListItem } from "@/api/comm";
import { THREAD_KIND_LABELS, type Viewer } from "@/lib/comm";
import { formatDateTime } from "@/lib/format";
import { ThreadStatus } from "./ThreadStatus";

interface Props {
  items: ThreadListItem[];
  hrefFor(item: ThreadListItem): string;
  viewer: Viewer;
}

/** Lista rozmów: temat (link), rodzaj, status, ostatnia wiadomość; autor widzi „Nowa odpowiedź”. */
export function ThreadList({ items, hrefFor, viewer }: Props) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((t) => (
        <li key={t.id} className="flex flex-col gap-2 rounded-md border border-solid border-line bg-surface p-4">
          <p className="m-0 flex flex-wrap items-center gap-2">
            <Link to={hrefFor(t)} className="text-body-lg font-bold [overflow-wrap:anywhere]">
              {t.subject}
            </Link>
            {viewer === "author" && t.has_reply && <span className="ds-badge">Nowa odpowiedź</span>}
          </p>
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
            <span>{THREAD_KIND_LABELS[t.kind]}</span>
            <ThreadStatus status={t.status} viewer={viewer} />
            {t.category_label_pl && <span>{t.category_label_pl}</span>}
            {viewer !== "author" && t.assigned_mentor && <span>Ekspert: {t.assigned_mentor.display_name}</span>}
            <span>
              Ostatnia wiadomość: <time dateTime={t.last_message_at}>{formatDateTime(t.last_message_at)}</time>
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
