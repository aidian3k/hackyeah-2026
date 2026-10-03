import { useId } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { commApi, type Intent, type OrgSector } from "@/api/comm";
import { OfferCard } from "@/components/comm/OfferCard";
import { EmptyState } from "@/components/EmptyState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useAuth } from "@/lib/auth";
import { INTENT_LABELS, SECTOR_LABELS } from "@/lib/comm";
import { plural } from "@/lib/format";

const PAGE_SIZE = 20;

/** Moduł 5: tablica partnerstw „oferujemy / szukamy” z filtrami w URL. */
export function PartnersPage() {
  useDocumentTitle("Tablica partnerstw");
  const { session } = useAuth();
  const { items: taxonomy } = useTaxonomy();
  const [params, setParams] = useSearchParams();
  const intent = params.get("intencja") ?? "";
  const sector = params.get("sektor") ?? "";
  const category = params.get("wyzwanie") ?? "";
  const offset = Number(params.get("od") ?? 0) || 0;
  const ids = { intent: useId(), sector: useId(), category: useId() };

  const offers = useApi(
    () => commApi.listOffers({ intent, sector, category, limit: PAGE_SIZE, offset }),
    [intent, sector, category, offset],
  );

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("od");
    setParams(next);
  }

  const total = offers.data?.total ?? 0;

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          Tablica partnerstw
        </h1>
        <p className="m-0 text-body-lg">
          Organizacje, samorządy, firmy i uczelnie piszą, co mogą dać i czego szukają. Hub pomaga
          połączyć strony — kontakt odbywa się przez rozmowę z Hubem.
        </p>
        {session?.role === "reporter" && (
          <p className="m-0">
            <Link to="/partnerzy/nowe" className="ds-btn ds-btn--primary">
              Dodaj ogłoszenie
            </Link>
          </p>
        )}
      </header>

      <form className="flex flex-wrap gap-4" aria-label="Filtry ogłoszeń" onSubmit={(e) => e.preventDefault()}>
        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.intent}>
            Rodzaj ogłoszenia
          </label>
          <select id={ids.intent} className="ds-select" value={intent} onChange={(e) => setFilter("intencja", e.target.value)}>
            <option value="">Wszystkie</option>
            {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
              <option key={k} value={k}>
                {INTENT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.sector}>
            Sektor
          </label>
          <select id={ids.sector} className="ds-select" value={sector} onChange={(e) => setFilter("sektor", e.target.value)}>
            <option value="">Wszystkie</option>
            {(Object.keys(SECTOR_LABELS) as OrgSector[]).map((k) => (
              <option key={k} value={k}>
                {SECTOR_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.category}>
            Wyzwanie
          </label>
          <select id={ids.category} className="ds-select" value={category} onChange={(e) => setFilter("wyzwanie", e.target.value)}>
            <option value="">Wszystkie</option>
            {taxonomy.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="ds-sr-only" aria-live="polite">
        {offers.data ? `Znaleziono ${total} ${plural(total, "ogłoszenie", "ogłoszenia", "ogłoszeń")}.` : ""}
      </p>

      <LoadState loading={offers.loading} error={offers.error} onRetry={offers.reload}>
        {offers.data &&
          (offers.data.items.length === 0 ? (
            <EmptyState title="Nie ma ogłoszeń dla wybranych filtrów.">
              <p>Zmień filtry albo dodaj własne ogłoszenie.</p>
            </EmptyState>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {offers.data.items.map((o) => (
                  <li key={o.id}>
                    <OfferCard offer={o} headingLevel={2} />
                  </li>
                ))}
              </ul>
              <Pagination
                total={total}
                limit={PAGE_SIZE}
                offset={offset}
                onChange={(next) => {
                  const p = new URLSearchParams(params);
                  if (next) p.set("od", String(next));
                  else p.delete("od");
                  setParams(p);
                }}
              />
            </>
          ))}
      </LoadState>
    </div>
  );
}
