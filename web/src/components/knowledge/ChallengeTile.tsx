import { Link } from "react-router-dom";
import type { ChallengeSummary } from "@/api/types";
import { plural } from "@/lib/format";
import { DemoTag } from "./DemoTag";

/** Kafelek wyzwania: cały jest jednym linkiem do strony wyzwania; fakt i liczniki są w treści linku. */
export function ChallengeTile({ challenge }: { challenge: ChallengeSummary }) {
  const { key_fact: fact } = challenge;
  return (
    <Link
      to={`/wiedza/wyzwania/${encodeURIComponent(challenge.code)}`}
      className="ds-card flex h-full flex-col gap-3 no-underline [overflow-wrap:anywhere] hover:shadow-card focus-visible:shadow-card"
    >
      <h3 className="m-0 font-sans text-h3 text-navy">{challenge.label_pl}</h3>
      {fact ? (
        <p className="m-0 flex flex-col text-body text-ink">
          <span className="font-sans text-h2 text-navy">
            {fact.value}
            {fact.unit ? ` ${fact.unit}` : ""}
          </span>
          <span>{fact.label_pl}</span>
        </p>
      ) : (
        challenge.lead_pl && <p className="m-0 line-clamp-3 text-body text-ink">{challenge.lead_pl}</p>
      )}
      <p className="m-0 mt-auto text-small text-ink-muted">
        {challenge.solutions_count}{" "}
        {plural(challenge.solutions_count, "innowacja", "innowacje", "innowacji")} ·{" "}
        {challenge.knowledge_count}{" "}
        {plural(challenge.knowledge_count, "opracowanie", "opracowania", "opracowań")}
      </p>
      {fact && challenge.is_demo && (
        <p className="m-0">
          <DemoTag />
        </p>
      )}
    </Link>
  );
}
