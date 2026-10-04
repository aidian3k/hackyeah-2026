import { useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, type ApiError } from "@/api/client";
import type { CallState, CallSummary } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError, useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginHref, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { CALL_STATE_LABELS } from "@/lib/labels";
import { listMyIdeas, type MyIdea } from "@/lib/storage";

const moneyFmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

function formatMoney(value: number): string {
  return `${moneyFmt.format(value)} zł`;
}

/** Materiały ROPS — bezpośrednie linki do czasu, aż Zasobnik (M2 Z08) wystawi `/wiedza/materialy`. */
const MATERIALS = [
  {
    title: "Social Innovation Canvas (INNOAGH)",
    description: "Kanwa, na której opiszesz pomysł krok po kroku.",
    url: "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf",
    format: "PDF, 7,7 MB",
  },
  {
    title: "Mapa Wyzwań Społecznych",
    description: "Obszary tematyczne, do których odwołuje się diagnoza problemu we wniosku.",
    url: "https://rops.krakow.pl/pliki-do-pobrania/artykul,mapa-wyzwan-spolecznych,1048",
    format: "PDF, 7,8 MB",
  },
];

/** Etykieta stanu naboru: kształt + słowo, kolor nie jest jedyną informacją. */
function CallStateTag({ state }: { state: CallState }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-solid border-line-strong bg-surface-sunken px-2 py-1 text-label text-ink">
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="h-4 w-4 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
      >
        {state === "open" && (
          <>
            <circle cx="8" cy="8" r="6.5" />
            <polyline points="5 8.5 7 10.5 11 6" />
          </>
        )}
        {state === "closed" && (
          <>
            <rect x="2" y="2" width="12" height="12" rx="1.5" />
            <line x1="5" y1="8" x2="11" y2="8" />
          </>
        )}
        {state === "upcoming" && (
          <>
            <circle cx="8" cy="8" r="6.5" />
            <polyline points="8 4.5 8 8 10.5 9.5" />
          </>
        )}
      </svg>
      {CALL_STATE_LABELS[state]}
    </span>
  );
}

export function CallsPage() {
  useDocumentTitle("Nabory");
  const calls = useApi(() => api.calls(), []);

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Nabory
          </h1>
          <p className="m-0 text-body-lg text-ink">
            Sprawdź otwarte konkursy grantowe i przygotuj wniosek na podstawie swojego pomysłu.
          </p>
        </div>
        <KreatorNav />
      </header>

      <section aria-labelledby="nabory-lista" className="flex flex-col gap-4">
        <h2 id="nabory-lista" className="m-0 font-sans text-h2 text-navy">
          Konkursy grantowe
        </h2>
        <LoadState loading={calls.loading} error={calls.error} onRetry={calls.reload} label="Wczytujemy nabory…">
          {calls.data && calls.data.length === 0 && <Alert tone="info">Nie ma teraz żadnych naborów.</Alert>}
          {calls.data && calls.data.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {calls.data.map((call) => (
                <li key={call.id}>
                  <CallCard call={call} />
                </li>
              ))}
            </ul>
          )}
        </LoadState>
      </section>

      <section aria-labelledby="nabory-materialy" className="flex max-w-3xl flex-col gap-4">
        <h2 id="nabory-materialy" className="m-0 font-sans text-h2 text-navy">
          Materiały
        </h2>
        <p className="m-0 text-body text-ink">
          Materiały Hubu pomogą Ci opisać pomysł i przygotować diagnozę problemu.{" "}
          <Link to="/wiedza" className="text-navy">
            Zobacz też Zasobnik wiedzy
          </Link>
          .
        </p>
        <ul className="m-0 flex flex-col gap-3 pl-6">
          {MATERIALS.map((m) => (
            <li key={m.url} className="text-body text-ink">
              <a href={m.url} className="font-bold text-navy">
                {m.title}
              </a>{" "}
              <span className="text-ink-muted">({m.format})</span>
              <br />
              {m.description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CallCard({ call }: { call: CallSummary }) {
  const titleId = useId();
  const detail = useApi(() => api.call(call.id), [call.id]);

  return (
    <article aria-labelledby={titleId} className="ds-card flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CallStateTag state={call.state} />
          {call.demo && (
            <span className="inline-flex items-center rounded-sm bg-soft-violet px-2 py-1 text-label text-violet">
              Przykładowy nabór
            </span>
          )}
        </div>
        <h3 id={titleId} className="m-0 font-sans text-h3 text-navy">
          {call.title}
        </h3>
        <p className="m-0 text-small text-ink-muted">{call.program}</p>
      </div>
      <p className="m-0 text-body text-ink">{call.short_pl}</p>

      <dl className="m-0 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-label text-ink-muted">Kwota grantu</dt>
          <dd className="m-0 text-body text-ink">do {formatMoney(call.max_amount)}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-label text-ink-muted">Termin naboru</dt>
          <dd className="m-0 text-body text-ink">
            {formatDate(call.opens_at)} – {formatDate(call.closes_at)}
          </dd>
        </div>
        {detail.data && detail.data.applicant_types.length > 0 && (
          <div className="flex flex-col sm:col-span-2">
            <dt className="text-label text-ink-muted">Kto może złożyć wniosek</dt>
            <dd className="m-0 text-body text-ink">{detail.data.applicant_types.join(", ")}</dd>
          </div>
        )}
      </dl>

      {detail.data && detail.data.based_on.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="m-0 text-label text-ink">Na podstawie dokumentów ROPS</p>
          <ul className="m-0 flex flex-col gap-1 pl-6">
            {detail.data.based_on.map((src) => (
              <li key={src.url} className="text-body">
                <a href={src.url} className="text-navy">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {call.is_open && detail.data && detail.data.sections.length > 0 && <StartApplication call={call} />}
      {!call.is_open && (
        <p className="m-0 text-body text-ink-muted">
          {call.state === "upcoming"
            ? `Wniosek przygotujesz od ${formatDate(call.opens_at)}.`
            : "Ten nabór jest zakończony. Pokazujemy go jako przykład kolejnego kroku."}
        </p>
      )}
    </article>
  );
}

/** Wybór pomysłu i utworzenie (albo otwarcie istniejącego) wniosku w naborze. */
function StartApplication({ call }: { call: CallSummary }) {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const selectId = useId();
  const [ideas] = useState<MyIdea[]>(() => listMyIdeas());
  const [ideaId, setIdeaId] = useState<string>(() => (ideas[0] ? String(ideas[0].idea_id) : ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  if (session?.role !== "reporter") {
    return (
      <p className="m-0 text-body text-ink">
        <Link to={loginHref(pathname)} className="text-navy">
          Zaloguj się
        </Link>
        , aby przygotować wniosek na podstawie swojego pomysłu.
      </p>
    );
  }

  if (ideas.length === 0) {
    return (
      <p className="m-0 text-body text-ink">
        Wniosek przygotujesz na podstawie zapisanego pomysłu.{" "}
        <Link to="/mam-pomysl" className="text-navy">
          Opisz pomysł
        </Link>
        , a potem wróć tutaj.
      </p>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !ideaId) return;
    setBusy(true);
    setError(null);
    try {
      const app = await api.createGrantApplication(Number(ideaId), call.id);
      navigate(`/wnioski/${app.id}`);
    } catch (err) {
      setError(toApiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3 border-0 border-t border-solid border-line pt-4">
      <div className="ds-field max-w-lg">
        <label htmlFor={selectId} className="ds-label">
          Pomysł, na podstawie którego przygotujesz wniosek
        </label>
        <select id={selectId} className="ds-select" value={ideaId} onChange={(e) => setIdeaId(e.target.value)}>
          {ideas.map((idea) => (
            <option key={idea.idea_id} value={idea.idea_id}>
              {idea.title_excerpt || `Pomysł nr ${idea.idea_id}`}
            </option>
          ))}
        </select>
        <p className="ds-hint">Odpowiedzi wypełnimy wstępnie treścią fiszki i kanwy. Jeśli wniosek już istnieje, otworzymy go.</p>
      </div>
      <div>
        <button type="submit" className="ds-btn ds-btn--primary" aria-busy={busy} aria-disabled={busy}>
          {busy ? "Przygotowujemy wniosek…" : "Przygotuj wniosek"}
        </button>
      </div>
      {error && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się przygotować wniosku.">
            {error.message}
          </Alert>
        </div>
      )}
    </form>
  );
}
