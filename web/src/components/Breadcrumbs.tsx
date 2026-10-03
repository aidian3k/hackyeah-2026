import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  /** Brak `to` = bieżąca strona (aria-current). */
  to?: string;
}

/** Okruszki „Jesteś tutaj”: ostatni element to bieżąca strona, bez linku. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Jesteś tutaj">
      <ol className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0 text-small text-ink-muted">
        {items.map((item) => (
          <li
            key={item.label}
            className="inline-flex min-w-0 gap-2 [overflow-wrap:anywhere] [&:not(:first-child)]:before:content-['›']"
          >
            {item.to ? (
              <Link to={item.to} className="text-navy">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
