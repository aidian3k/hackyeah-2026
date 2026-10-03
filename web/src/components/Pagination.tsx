interface Props {
  total: number;
  limit: number;
  offset: number;
  onChange(offset: number): void;
}

/** „Poprzednia / Następna” + „Strona 2 z 7”. Przy jednej stronie nie renderuje się. */
export function Pagination({ total, limit, offset, onChange }: Props) {
  const size = Math.max(1, limit);
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const page = Math.min(pages, Math.floor(offset / size) + 1);
  const hasPrev = page > 1;
  const hasNext = page < pages;

  return (
    <nav className="ds-pagination" aria-label="Strony wyników">
      <p className="ds-pagination__status" aria-live="polite">
        Strona {page} z {pages}
      </p>
      <div className="ds-pagination__controls">
        <button
          type="button"
          className="ds-btn"
          disabled={!hasPrev}
          onClick={() => onChange(Math.max(0, (page - 2) * size))}
        >
          Poprzednia<span className="ds-sr-only"> strona</span>
        </button>
        <button type="button" className="ds-btn" disabled={!hasNext} onClick={() => onChange(page * size)}>
          Następna<span className="ds-sr-only"> strona</span>
        </button>
      </div>
    </nav>
  );
}
