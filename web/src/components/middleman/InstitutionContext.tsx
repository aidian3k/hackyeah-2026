// Moduł 7: Middleman innowacji — opcjonalny kontekst instytucji w kolumnie bocznej rozmowy.
import { useId } from "react";
import { Link } from "react-router-dom";
import type { AdaptContext } from "@/api/middleman";
import { ReporterTypeField } from "@/components/chat/ReporterTypeField";
import { GminaSelect } from "@/components/GminaSelect";

interface Props {
  value: AdaptContext;
  onChange(value: AdaptContext): void;
  solutionId: number;
}

/**
 * „O Twojej instytucji (opcjonalnie)”: typ zgłaszającego (domyślnie „Nie chcę podawać”) i gmina.
 * Zmiany obowiązują od następnego pytania — hook czyta bieżący kontekst przy każdym wysłaniu.
 */
export function InstitutionContext({ value, onChange, solutionId }: Props) {
  const uid = useId();
  const headingId = `${uid}-heading`;
  const gminaId = `${uid}-gmina`;

  return (
    <>
      <section aria-labelledby={headingId} className="ds-card flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="m-0 text-h3">
            O Twojej instytucji (opcjonalnie)
          </h2>
          <p className="m-0 text-small text-ink-muted">Zmiany obowiązują od następnego pytania.</p>
        </div>
        <ReporterTypeField
          name={`${uid}-reporter`}
          value={value.reporter_type ?? "OTHER"}
          onChange={(reporter_type) => onChange({ ...value, reporter_type })}
        />
        <GminaSelect
          id={gminaId}
          label="Gmina (opcjonalnie)"
          hint="Asystent dopasuje odpowiedzi do typu gminy."
          value={value.gmina}
          onChange={(gmina) => onChange({ ...value, gmina })}
        />
      </section>
      <nav aria-label="Więcej o innowacji" className="flex flex-col items-start gap-1">
        <Link to={`/rozwiazania/${solutionId}`} className="ds-btn ds-btn--link px-0">
          Opis innowacji
        </Link>
        <Link to="/rozmowy/nowa?rodzaj=ekspert" className="ds-btn ds-btn--link px-0">
          Porozmawiaj z ekspertem Hubu
        </Link>
      </nav>
    </>
  );
}
