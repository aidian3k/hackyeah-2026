import { useId } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ZasobnikHeader } from "@/components/layout/ZasobnikHeader";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE = 24;
/** Maksimum `limit` w GET /api/solutions; materiałów jest niewiele, więc stronicujemy po stronie klienta. */
const FETCH_LIMIT = 100;
/** Wartość `?category=` dla materiałów ogólnych (bez wyzwania). */
const GENERAL = "none";

/** Materiały edukacyjne (MATERIAL): filtr wyzwania w URL, „Materiały ogólne” = bez kategorii. */
export function MaterialsPage() {
  useDocumentTitle("Materiały");
  const id = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const challenges = useApi(() => api.challenges(), []);
  const materials = useApi(
    () =>
      api.solutions({
        kind: "KNOWLEDGE",
        knowledge_type: "MATERIAL",
        category: category && category !== GENERAL ? category : null,
        limit: FETCH_LIMIT,
      }),
    [category],
  );

  // API nie filtruje po braku kategorii — „Materiały ogólne” wycinamy po stronie klienta.
  const all = (materials.data?.items ?? []).filter((c) => category !== GENERAL || c.category === null);
  const shown = all.slice(offset, offset + PAGE_SIZE);

  const setCategory = (value: string) =>
    setSearchParams(value ? new URLSearchParams({ category: value }) : new URLSearchParams());
  const setOffset = (next: number) =>
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      if (next > 0) sp.set("offset", String(next));
      else sp.delete("offset");
      return sp;
    });

  return (
    <div className="ds-page">
      <div className="flex flex-col gap-6">
        <ZasobnikHeader
          title="Materiały"
          lead="Przewodniki, narzędzia i podcasty ROPS Kraków o innowacjach społecznych i usługach dla mieszkańców."
        />

        <div className="ds-field max-w-md">
          <label className="ds-label" htmlFor={`${id}-category`}>
            Wyzwanie społeczne
          </label>
          <select
            id={`${id}-category`}
            className="ds-select"
            value={category ?? ""}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Wszystkie materiały</option>
            <option value={GENERAL}>Materiały ogólne</option>
            {challenges.data?.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label_pl}
              </option>
            ))}
          </select>
        </div>

        <section aria-label="Wyniki" className="flex flex-col gap-4">
          <LoadState
            loading={materials.loading}
            error={materials.error}
            onRetry={materials.reload}
            label="Wczytujemy materiały…"
          >
            {all.length === 0 ? (
              <EmptyState title="Nie ma materiałów dla wybranego wyzwania.">
                <p>
                  <button type="button" className="ds-btn ds-btn--link px-0" onClick={() => setCategory("")}>
                    Pokaż wszystkie materiały
                  </button>
                </p>
              </EmptyState>
            ) : (
              <>
                <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((card) => (
                    <li key={card.id} className="flex min-w-0">
                      <SolutionCard card={card} headingLevel={2} />
                    </li>
                  ))}
                </ul>
                <Pagination total={all.length} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
              </>
            )}
          </LoadState>
        </section>
      </div>
    </div>
  );
}
