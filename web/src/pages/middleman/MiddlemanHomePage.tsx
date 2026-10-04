import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { adaptPath } from "@/lib/middleman";
import { MODULE_NAMES } from "@/lib/modules";

const RESULTS_LIMIT = 10;

const STEPS = [
  "Wybierz innowację z Biblioteki",
  "Opowiedz o swojej instytucji (opcjonalnie)",
  "Zapytaj asystenta, kto mógłby ją prowadzić, jak zacząć i na co uważać",
];

/** Moduł 7: wejście do Middlemana innowacji `/wdrozenie` — jak to działa i wybór innowacji. */
export function MiddlemanHomePage() {
  useDocumentTitle(MODULE_NAMES.middleman);
  const id = useId();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  const results = useApi(
    () => api.solutions({ q: q || null, kind: "SOLUTION", limit: RESULTS_LIMIT }),
    [q],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQ(text.trim());
  };

  const items = results.data?.items ?? [];

  return (
    <div className="ds-page [overflow-wrap:anywhere]">
      <header className="flex max-w-3xl flex-col gap-3">
        <ModuleLabel module="middleman" />
        <h1 tabIndex={-1} className="m-0">
          Jak wdrożyć innowację u siebie
        </h1>
        <p className="m-0 text-body-lg">
          Asystent pomoże przenieść sprawdzoną innowację z Biblioteki do codziennej pracy Twojej
          gminy, ośrodka pomocy, biblioteki albo organizacji.
        </p>
      </header>

      <section aria-labelledby={`${id}-steps`} className="flex max-w-3xl flex-col gap-3">
        <h2 id={`${id}-steps`} className="m-0">
          Jak to działa
        </h2>
        <ol className="m-0 flex flex-col gap-2 pl-6 text-body text-ink">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="m-0 text-small text-ink-muted">
          Asystent nie podaje kosztów — w sprawie finansowania pomoże zespół Hubu.
        </p>
      </section>

      <section aria-labelledby={`${id}-results`} className="flex max-w-3xl flex-col gap-4">
        <h2 id={`${id}-results`} className="m-0">
          Wybierz innowację
        </h2>
        <form role="search" onSubmit={submit} className="flex flex-col gap-3">
          <div className="ds-field">
            <label className="ds-label" htmlFor={`${id}-q`}>
              Znajdź innowację
            </label>
            <input
              id={`${id}-q`}
              className="ds-input"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <button type="submit" className="ds-btn ds-btn--primary">
              Szukaj
            </button>
          </div>
        </form>

        <LoadState
          loading={results.loading}
          error={results.error}
          onRetry={results.reload}
          label="Szukamy innowacji…"
        >
          {results.data &&
            (items.length === 0 ? (
              <div role="status">
                <EmptyState title="Nie znaleźliśmy innowacji.">
                  <p>
                    Spróbuj innego słowa albo przejdź do{" "}
                    <Link to="/rozwiazania">Biblioteki innowacji</Link>.
                  </p>
                </EmptyState>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {items.map((s) => (
                  <li key={s.id} className="ds-card flex flex-col gap-2">
                    <h3 className="m-0 font-sans text-h3 text-navy">{s.title}</h3>
                    {s.category_label_pl && (
                      <p className="m-0 text-small text-ink-muted">{s.category_label_pl}</p>
                    )}
                    {s.summary && <p className="m-0 line-clamp-2 text-body text-ink">{s.summary}</p>}
                    <div>
                      <Link
                        className="ds-btn ds-btn--link px-0"
                        to={adaptPath(s.id)}
                        aria-label={`Zapytaj asystenta: ${s.title}`}
                      >
                        Zapytaj asystenta
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </LoadState>
      </section>
    </div>
  );
}
