import { Link } from "react-router-dom";
import type { InnovationTest } from "@/api/types";
import { TEST_MODE_LABELS, TEST_STATUS_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

interface Props {
  items: InnovationTest[];
  emptyTitle?: string;
  linkPrefix?: string;
}

/** Czy tytuł naboru to tylko wariant „Szukamy testerów…”, zbędny obok nazwy rozwiązania. */
function isGenericCallForTesters(title: string): boolean {
  return /^szukamy\s+tester/i.test(title.trim());
}

function listHeading(item: InnovationTest): string {
  const solution = item.solution_title?.trim();
  if (solution) return solution;
  return item.title;
}

/** Dodatkowy podpis naboru — tylko gdy wnosi coś poza nazwą rozwiązania. */
function listSubtitle(item: InnovationTest): string | null {
  const solution = item.solution_title?.trim();
  const title = item.title.trim();
  if (!solution) return null;
  if (title === solution) return null;
  if (isGenericCallForTesters(title)) return null;
  return title;
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
      {items.map((item) => {
        const subtitle = listSubtitle(item);
        return (
          <li key={item.id} className="flex flex-col gap-2 rounded-md bg-surface-muted p-4">
            <Link
              to={`${linkPrefix}/${item.id}`}
              className="font-sans text-h3 text-navy decoration-[0.08em]"
            >
              {listHeading(item)}
            </Link>
            {subtitle && <p className="m-0 text-small text-ink-muted">{subtitle}</p>}
            <p className="m-0 text-small text-ink-muted">
              {TEST_STATUS_LABELS[item.status]} · {TEST_MODE_LABELS[item.mode]} · miejsca{" "}
              {item.seats_accepted}/{item.seats_limit} · do {formatDate(item.ends_at)}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            <p className="m-0 text-small text-ink-muted">{item.goal_description}</p>
          </li>
        );
      })}
    </ul>
  );
}
