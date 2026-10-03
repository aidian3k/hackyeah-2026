import { Link } from "react-router-dom";
import type { PartnershipOffer } from "@/api/comm";
import { INTENT_LABELS, SECTOR_LABELS } from "@/lib/comm";

interface Props {
  offer: PartnershipOffer;
  /** Dopisek przy dopasowaniu, np. „Inny sektor”. */
  note?: string;
  headingLevel?: 2 | 3;
}

/** Karta ogłoszenia partnerstwa: intencja, tytuł (link), organizacja, sektor, wyzwanie, skrót opisu. */
export function OfferCard({ offer, note, headingLevel = 3 }: Props) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <article className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
      <p className="m-0 flex flex-wrap items-center gap-2 text-small">
        <span className="ds-tag">{INTENT_LABELS[offer.intent]}</span>
        {note && <span className="ds-badge">{note}</span>}
        {offer.status === "CLOSED" && <span className="ds-tag">Zamknięte</span>}
      </p>
      <Heading className="m-0 text-h3 [overflow-wrap:anywhere]">
        <Link to={`/partnerzy/${offer.id}`}>{offer.title}</Link>
      </Heading>
      <p className="m-0 text-small text-ink-muted">
        {offer.organization} · {SECTOR_LABELS[offer.sector]}
        {offer.category_label_pl && ` · ${offer.category_label_pl}`}
      </p>
      <p className="m-0 line-clamp-3 [overflow-wrap:anywhere]">{offer.description}</p>
    </article>
  );
}
