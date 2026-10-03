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
  emptyTitle = "Brak otwartych naborów.",
  linkPrefix = "/testy",
}: Props) {
  if (items.length === 0) {
    return <p className="m4-lead">{emptyTitle}</p>;
  }
  return (
    <ul className="m4-list">
      {items.map((item) => (
        <li key={item.id} className="m4-list__item">
          <Link to={`${linkPrefix}/${item.id}`}>{item.title}</Link>
          <p className="m4-list__meta">
            {item.solution_title ? `${item.solution_title} · ` : ""}
            {TEST_STATUS_LABELS[item.status]} · {TEST_MODE_LABELS[item.mode]} · miejsca{" "}
            {item.seats_accepted}/{item.seats_limit} · do {formatDate(item.ends_at)}
          </p>
          <p className="m4-list__meta">{item.goal_description}</p>
        </li>
      ))}
    </ul>
  );
}
