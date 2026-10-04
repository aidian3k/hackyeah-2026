import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { SolutionDetail } from "@/api/types";
import { LoadState } from "@/components/LoadState";
import { SolutionCard } from "@/components/SolutionCard";
import { useApi } from "@/hooks/useApi";
import { ropsGroup } from "@/lib/ropsGroups";

const SIMILAR_LIMIT = 3;

/** „Podobne innowacje”: do 3 kart z tej samej grupy ROPS (bez grupy — z tej samej kategorii) i link do całej grupy. */
export function SimilarSolutions({ current }: { current: SolutionDetail }) {
  const group = ropsGroup(current.tags);
  const category = current.category;
  const { data, error, loading, reload } = useApi(
    () =>
      api.solutions({
        kind: "SOLUTION",
        tag: group?.tag ?? null,
        category: group ? null : category,
        limit: SIMILAR_LIMIT + 1,
      }),
    [current.id],
  );

  if (!group && !category) return null;
  const similar = (data?.items ?? []).filter((c) => c.id !== current.id).slice(0, SIMILAR_LIMIT);
  if (data && similar.length === 0) return null;

  const moreTo = group
    ? `/rozwiazania?tag=${encodeURIComponent(group.tag)}`
    : `/rozwiazania?category=${encodeURIComponent(category ?? "")}`;
  const moreLabel = group ? group.label : (current.category_label_pl ?? "to wyzwanie");

  return (
    <section aria-labelledby="similar" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="similar" className="m-0 font-sans text-h2 text-navy">
          Podobne innowacje
        </h2>
        <Link to={moreTo}>Więcej dla: {moreLabel}</Link>
      </div>
      <LoadState loading={loading} error={error} onRetry={reload} label="Szukamy podobnych innowacji…">
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((card) => (
            <li key={card.id} className="flex min-w-0">
              <SolutionCard card={card} headingLevel={3} visual />
            </li>
          ))}
        </ul>
      </LoadState>
    </section>
  );
}
