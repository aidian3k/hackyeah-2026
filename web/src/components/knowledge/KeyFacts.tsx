import type { KeyFact } from "@/api/types";
import { DemoTag } from "./DemoTag";

interface Props {
  facts: KeyFact[];
  isDemo: boolean;
}

function Source({ fact }: { fact: KeyFact }) {
  if (!fact.source_url) return <>{fact.source_name}</>;
  return (
    <a href={fact.source_url} target="_blank" rel="noopener noreferrer">
      {fact.source_name}
      <span className="ds-sr-only"> (otwiera się w nowej karcie)</span>
    </a>
  );
}

/** Kluczowe fakty ze źródłami: wartość, opis, rok i link do źródła. Dane przykładowe są oznaczone tekstem. */
export function KeyFacts({ facts, isDemo }: Props) {
  if (facts.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {isDemo && (
        <p className="m-0">
          <DemoTag />
        </p>
      )}
      <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={`${fact.label_pl}-${fact.year ?? ""}`} className="ds-card flex flex-col-reverse gap-1">
            <dt className="flex flex-col gap-1 text-body text-ink">
              <span>{fact.label_pl}</span>
              <span className="text-small text-ink-muted">
                {fact.year ? `${fact.year} · ` : ""}
                <Source fact={fact} />
              </span>
            </dt>
            <dd className="m-0 font-sans text-h2 text-navy">
              {fact.value}
              {fact.unit ? <span className="ml-1 text-body text-ink">{fact.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
