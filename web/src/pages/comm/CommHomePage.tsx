import { useState } from "react";
import { Link } from "react-router-dom";
import { commApi } from "@/api/comm";
import { ThreadList } from "@/components/comm/ThreadList";
import { EmptyState } from "@/components/EmptyState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { listMyThreads } from "@/lib/comm";

/** Moduł 5: wejście do Platformy komunikacji — nowe pytanie, ekspert, partnerstwa i „Moje rozmowy”. */
export function CommHomePage() {
  useDocumentTitle("Platforma komunikacji");
  // Lista z tej przeglądarki (bez kont); stan aktualny pobieramy z API.
  const [mine] = useState(() => listMyThreads());
  const ids = mine.map((t) => t.thread_id).join(",");
  const threads = useApi(
    () => (ids ? commApi.listThreads({ ids, limit: 50 }) : Promise.resolve(null)),
    [ids],
  );

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          Porozmawiaj z Hubem
        </h1>
        <p className="m-0 text-body-lg">
          Zadaj pytanie — asystent od razu poszuka odpowiedzi w Bibliotece Innowacji, a zespół Hubu
          odpowie, gdy to nie wystarczy. Możesz też poprosić o rozmowę z ekspertem albo znaleźć
          partnera do działania.
        </p>
      </header>

      <ul className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label="Co chcesz zrobić?">
        <li>
          <Link to="/rozmowy/nowa" className="ds-btn ds-btn--cta">
            Zadaj pytanie
          </Link>
        </li>
        <li>
          <Link to="/rozmowy/nowa?rodzaj=ekspert" className="ds-btn">
            Poproś o eksperta
          </Link>
        </li>
        <li>
          <Link to="/partnerzy" className="ds-btn">
            Tablica partnerstw
          </Link>
        </li>
      </ul>

      <section aria-labelledby="moje-rozmowy" className="flex flex-col gap-4">
        <h2 id="moje-rozmowy" className="m-0">
          Moje rozmowy
        </h2>
        {mine.length === 0 ? (
          <EmptyState title="Nie masz jeszcze rozmów na tym urządzeniu.">
            <p>Rozmowy, które zaczniesz w tej przeglądarce, pojawią się tutaj razem z odpowiedziami.</p>
          </EmptyState>
        ) : (
          <LoadState loading={threads.loading} error={threads.error} onRetry={threads.reload}>
            {threads.data && (
              <ThreadList items={threads.data.items} viewer="author" hrefFor={(t) => `/rozmowy/${t.id}`} />
            )}
          </LoadState>
        )}
      </section>
    </div>
  );
}
