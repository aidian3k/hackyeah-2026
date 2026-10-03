import { useEffect, useRef } from "react";
import type { ApiError } from "@/api/client";
import type { Page, SolutionCard as SolutionCardData } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { SolutionCard } from "@/components/SolutionCard";
import { plural } from "@/lib/format";
import "@/styles/catalog.css";

interface Props {
  data: Page<SolutionCardData> | null;
  loading: boolean;
  error: ApiError | null;
  onRetry(): void;
  onPageChange(offset: number): void;
  onClear(): void;
}

/** Licznik wyników (aria-live), siatka kart i paginacja katalogu. */
export function CatalogResults({ data, loading, error, onRetry, onPageChange, onClear }: Props) {
  const countRef = useRef<HTMLParagraphElement>(null);
  const focusAfterLoad = useRef(false);

  // Po zmianie strony: gdy nowe wyniki są na ekranie, przewiń do licznika i przenieś na niego fokus.
  useEffect(() => {
    if (!focusAfterLoad.current || loading || !data) return;
    focusAfterLoad.current = false;
    countRef.current?.scrollIntoView({ block: "start" });
    countRef.current?.focus({ preventScroll: true });
  }, [data, loading]);

  const changePage = (offset: number) => {
    focusAfterLoad.current = true;
    onPageChange(offset);
  };

  const ready = !loading && !error && data;
  const pastEnd = ready && data.items.length === 0 && data.total > 0;

  return (
    <section className="catalog-results ds-stack" aria-label="Wyniki">
      {/* Region stale w DOM, żeby czytnik ogłosił nową liczbę wyników. */}
      <p ref={countRef} className="catalog-results__count" aria-live="polite" tabIndex={-1}>
        {ready
          ? `Znaleziono ${data.total} ${plural(data.total, "rozwiązanie", "rozwiązania", "rozwiązań")}.`
          : ""}
      </p>
      <LoadState loading={loading} error={error} onRetry={onRetry} label="Wczytujemy rozwiązania…">
        {ready && data.total === 0 && (
          <EmptyState title="Nic nie pasuje do wybranych filtrów.">
            <p>
              <button type="button" className="ds-btn" onClick={onClear}>
                Wyczyść filtry
              </button>
            </p>
          </EmptyState>
        )}
        {pastEnd && (
          <EmptyState title="Na tej stronie nie ma już wyników.">
            <p>
              <button type="button" className="ds-btn" onClick={() => changePage(0)}>
                Przejdź do pierwszej strony
              </button>
            </p>
          </EmptyState>
        )}
        {ready && data.items.length > 0 && (
          <>
            <ul className="ds-grid card-list">
              {data.items.map((card) => (
                <li key={card.id}>
                  <SolutionCard card={card} headingLevel={2} />
                </li>
              ))}
            </ul>
            <Pagination total={data.total} limit={data.limit} offset={data.offset} onChange={changePage} />
          </>
        )}
      </LoadState>
    </section>
  );
}
