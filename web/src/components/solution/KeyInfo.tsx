import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SolutionDetail } from "@/api/types";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { projectName, ropsGroup } from "@/lib/ropsGroups";

function place(gmina: string | null, powiat: string | null): string | null {
  if (gmina && powiat) return `${gmina} (powiat ${powiat})`;
  if (gmina) return gmina;
  if (powiat) return `powiat ${powiat}`;
  return null;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-sans text-label text-ink-muted">{label}</dt>
      <dd className="m-0 text-body text-ink">{children}</dd>
    </div>
  );
}

/** „Najważniejsze informacje”: karta z kluczowymi danymi innowacji lub wpisu wiedzy; puste pola pomijamy. */
export function KeyInfo({ data }: { data: SolutionDetail }) {
  const isKnowledge = data.kind === "KNOWLEDGE";
  const group = ropsGroup(data.tags);
  const project = projectName(data.tags);
  const where = place(data.gmina, data.powiat);

  return (
    <section aria-labelledby="key-info" className="ds-card flex flex-col gap-4">
      <h2 id="key-info" className="m-0 font-sans text-h3 text-navy">
        Najważniejsze informacje
      </h2>
      <dl className="m-0 flex flex-col gap-4">
        {data.target_group && <Row label="Dla kogo">{data.target_group}</Row>}
        {!isKnowledge && group && <Row label="Grupa odbiorców">{group.label}</Row>}
        {data.category && data.category_label_pl && (
          <Row label="Wyzwanie">
            <Link to={`/wiedza/wyzwania/${encodeURIComponent(data.category)}`}>{data.category_label_pl}</Link>
          </Row>
        )}
        {!isKnowledge && (
          <Row label="Poziom sprawdzenia">
            <EvidenceBadge level={data.evidence_level} withLabel={false} />
          </Row>
        )}
        {!isKnowledge && data.cost_range && <Row label="Koszt">{data.cost_range}</Row>}
        {project && <Row label="Projekt">{project}</Row>}
        {data.organization && <Row label="Organizacja">{data.organization}</Row>}
        {where && <Row label="Miejsce">{where}</Row>}
        {(data.source_name || data.source_url) && (
          <Row label="Źródło">
            {data.source_url ? (
              <a href={data.source_url} target="_blank" rel="noopener noreferrer">
                {data.source_name ?? "Zobacz opis u źródła"}
                <span className="ds-sr-only"> (otwiera się w nowej karcie)</span>
              </a>
            ) : (
              data.source_name
            )}
          </Row>
        )}
      </dl>
    </section>
  );
}
