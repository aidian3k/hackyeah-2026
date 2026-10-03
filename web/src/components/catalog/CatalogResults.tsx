import { useEffect, useRef } from "react";
import type { ApiError } from "@/api/client";
import type { Page, SolutionCard as SolutionCardData } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { SolutionCard } from "@/components/SolutionCard";
import { plural } from "@/lib/format";

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
    <section className="flex min-w-0 flex-col gap-4" aria-label="Wyniki">
      {/* Region stale w DOM, żeby czytnik ogłosił nową liczbę wyników. */}
      <p
        ref={countRef}
        className="m-0 scroll-mt-16 font-sans text-h3 text-ink"
        aria-live="polite"
        tabIndex={-1}
      >
        {ready ? `Znaleziono ${data.total} ${plural(data.total, "innowację", "innowacje", "innowacji")}.` : ""}
      </p>
      <LoadState loading={loading} error={error} onRetry={onRetry} label="Wczytujemy innowacje…">
        {ready && data.total === 0 && (
          <EmptyState title="Nic nie pasuje do wybranych filtrów.">
            <p>
              Spróbuj innego słowa albo innej grupy.{" "}
              <button type="button" className="ds-btn ds-btn--link px-0" onClick={onClear}>
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
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((card) => (
                <li key={card.id} className="flex min-w-0">
                  <SolutionCard card={card} headingLevel={3} visual />
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
