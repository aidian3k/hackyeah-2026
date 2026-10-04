import { Link } from "react-router-dom";
import type { InnovationTest } from "@/api/types";
import { TEST_MODE_LABELS, TEST_STATUS_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

interface Props {
  items: InnovationTest[];
  emptyTitle?: string;
  linkPrefix?: string;
}

export function InnovationTestList({
  items,
  emptyTitle = "Brak otwartych rekrutacji testerów.",
  linkPrefix = "/testy",
}: Props) {
  if (items.length === 0) {
    return <p className="m-0 text-body-lg text-ink">{emptyTitle}</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-md bg-surface-muted p-4">
          <Link
            to={`${linkPrefix}/${item.id}`}
            className="font-sans text-h3 text-navy decoration-[0.08em]"
          >{item.title}</Link>
          <p className="m-0 text-small text-ink-muted">
            {item.solution_title ? `${item.solution_title} · ` : ""}
            {TEST_STATUS_LABELS[item.status]} · {TEST_MODE_LABELS[item.mode]} · miejsca{" "}
            {item.seats_accepted}/{item.seats_limit} · do {formatDate(item.ends_at)}
          </p>
          <p className="m-0 text-small text-ink-muted">{item.goal_description}</p>
        </li>
      ))}
    </ul>
  );
}
