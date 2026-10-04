import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { IdeaDetail, ReportDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { AssistPanel } from "@/components/assistant/AssistPanel";
import { SimilarInnovations } from "@/components/assistant/SimilarInnovations";
import {
  EMPTY_IDEA_VALUES,
  IDEA_LIMITS,
  IdeaForm,
  valuesFromIdea,
  type IdeaFormHandle,
  type IdeaFormValues,
  type IdeaSaveResult,
} from "@/components/idea/IdeaForm";
import { IdeaStatusCard } from "@/components/idea/IdeaStatusCard";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Komunikat po przejściu z nowej fiszki na zapisaną (stan nawigacji, bez treści w URL). */
type Flash = { kind: "saved" } | { kind: "submitted" } | { kind: "submit_error"; message: string };

function parseId(raw: string | null | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function isFlash(x: unknown): x is Flash {
  if (!x || typeof x !== "object") return false;
  const kind = (x as { kind?: unknown }).kind;
  return kind === "saved" || kind === "submitted" || kind === "submit_error";
}

function PageHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-3">
        <ModuleLabel module="kreator" />
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          {title}
        </h1>
        <p className="m-0 text-body-lg text-ink">{lead}</p>
      </div>
      <KreatorNav />
    </header>
  );
}

/** Fiszka pomysłu (K08): nowa na `/mam-pomysl` (opcjonalnie `?zgloszenie=<nr>`), zapisana na `/mam-pomysl/:id`. */
export function IdeaPage() {
  const { id: rawId } = useParams();
  if (rawId === undefined) return <NewIdea />;
  return <SavedIdea key={rawId} id={parseId(rawId)} />;
}

// --- nowy pomysł ----------------------------------------------------------------------

function NewIdea() {
  useDocumentTitle("Mam pomysł");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawReport = params.get("zgloszenie");
  const reportId = parseId(rawReport);

  function handleSaved({ idea, action, submitError }: IdeaSaveResult) {
    const flash: Flash =
      action === "submit"
        ? submitError
          ? { kind: "submit_error", message: submitError.message }
          : { kind: "submitted" }
        : { kind: "saved" };
    // Zastępujemy wpis nowej fiszki, żeby „Wstecz” nie tworzyło drugiego pomysłu z tego samego zgłoszenia.
    navigate(`/mam-pomysl/${idea.id}`, { replace: true, state: action === "canvas" ? undefined : flash });
    if (action === "canvas") navigate(`/mam-pomysl/${idea.id}/kanwa`);
  }

  return (
    <div className="ds-page">
      <PageHeader
        title="Podziel się pomysłem"
        lead="Opisz pomysł na rozwiązanie problemu w Twojej okolicy. Zapisz go, rozwiń na kanwie i wyślij do zespołu Hubu."
      />
      {rawReport !== null && reportId === null && (
        <Alert tone="info">Nie rozpoznaliśmy numeru zgłoszenia. Opisz pomysł od początku.</Alert>
      )}
      {reportId !== null ? (
        <FromReport reportId={reportId} onSaved={handleSaved} />
      ) : (
        <NewIdeaLayout initial={EMPTY_IDEA_VALUES} sourceReportId={null} onSaved={handleSaved} />
      )}
    </div>
  );
}

function prefillFromReport(report: ReportDetail): IdeaFormValues {
  return {
    ...EMPTY_IDEA_VALUES,
    summary: report.raw_text.trim().slice(0, IDEA_LIMITS.summaryMax),
    // OTHER nie ma na liście wyzwań fiszki.
    category: report.category && report.category !== "OTHER" ? report.category : "",
    gmina: report.gmina,
  };
}

function FromReport({ reportId, onSaved }: { reportId: number; onSaved(r: IdeaSaveResult): void }) {
  const { data, error, loading } = useApi<ReportDetail>(() => api.report(reportId), [reportId]);

  if (loading) return <LoadState loading label="Wczytujemy Twoje zgłoszenie…" error={null} />;

  if (error || !data) {
    return (
      <>
        <Alert tone="info">
          {error?.status === 404
            ? `Nie znaleźliśmy zgłoszenia nr ${reportId}. Opisz pomysł od początku.`
            : `Nie udało się wczytać zgłoszenia nr ${reportId}. Opisz pomysł od początku.`}
        </Alert>
        <NewIdeaLayout initial={EMPTY_IDEA_VALUES} sourceReportId={null} onSaved={onSaved} />
      </>
    );
  }

  return (
    <>
      <Alert tone="info">
        {`Wypełniliśmy opis na podstawie Twojego zgłoszenia nr ${data.id}. Sprawdź go, dopisz tytuł i uzupełnij resztę fiszki.`}
      </Alert>
      <NewIdeaLayout key={data.id} initial={prefillFromReport(data)} sourceReportId={data.id} onSaved={onSaved} />
    </>
  );
}

interface NewLayoutProps {
  initial: IdeaFormValues;
  sourceReportId: number | null;
  onSaved(r: IdeaSaveResult): void;
}

function NewIdeaLayout({ initial, sourceReportId, onSaved }: NewLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <IdeaForm initial={initial} idea={null} sourceReportId={sourceReportId} onSaved={onSaved} />
      </div>
      <aside aria-labelledby="asystent-przed-zapisem" className="min-w-0">
        <div className="ds-card flex flex-col gap-2">
          <h2 id="asystent-przed-zapisem" className="m-0 font-sans text-h3 text-navy">
            Podpowiedzi asystenta
          </h2>
          <p className="m-0 text-body text-ink">
            Zapisz pomysł, żeby skorzystać z asystenta i zobaczyć podobne innowacje z Biblioteki.
          </p>
        </div>
      </aside>
    </div>
  );
}

// --- zapisany pomysł ------------------------------------------------------------------

function SavedIdea({ id }: { id: number | null }) {
  useDocumentTitle(id === null ? "Pomysł" : `Pomysł nr ${id}`);
  const loaded = useApi<IdeaDetail>(
    () => (id === null ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono pomysłu.")) : api.idea(id)),
    [id],
  );

  return (
    <div className="ds-page">
      <PageHeader
        title="Fiszka pomysłu"
        lead="Uzupełnij fiszkę, poproś asystenta o podpowiedź i rozwiń pomysł na kanwie Social Canvas."
      />
      {loaded.error?.status === 404 ? (
        <div role="alert">
          <Alert tone="warning" title="Nie znaleźliśmy tego pomysłu.">
            <p>Sprawdź numer albo wróć do listy swoich pomysłów.</p>
            <p>
              <Link to="/moje-pomysly">Moje pomysły</Link>
            </p>
          </Alert>
        </div>
      ) : (
        <LoadState
          loading={loaded.loading && !loaded.data}
          error={loaded.error}
          onRetry={loaded.reload}
          label="Wczytujemy pomysł…"
        >
          {loaded.data && <SavedIdeaView initial={loaded.data} />}
        </LoadState>
      )}
    </div>
  );
}

function SavedIdeaView({ initial }: { initial: IdeaDetail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<IdeaDetail>(initial);
  const [flash, setFlash] = useState<Flash | null>(() => (isFlash(location.state) ? location.state : null));
  const flashRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<IdeaFormHandle>(null);
  const [formValues] = useState(() => valuesFromIdea(initial));

  // Komunikat po wysłaniu lub zapisie dostaje fokus, żeby czytnik go przeczytał.
  useEffect(() => {
    if (flash) flashRef.current?.focus();
  }, [flash]);

  function handleSaved({ idea: saved, action }: IdeaSaveResult) {
    setIdea(saved);
    if (action === "canvas") {
      navigate(`/mam-pomysl/${saved.id}/kanwa`);
      return;
    }
    // Zapis bez wysłania ogłasza formularz; komunikat zostaje tylko po wysłaniu.
    setFlash(action === "submit" ? { kind: "submitted" } : null);
  }

  return (
    <>
      <div ref={flashRef} tabIndex={-1} className="flex flex-col gap-3 empty:hidden focus:outline-none">
        {flash?.kind === "submitted" && (
          <Alert tone="success" title="Wysłano.">
            {`Pomysł nr ${idea.id} trafił do zespołu Hubu. Odpowiedź zobaczysz w zakładce Moje pomysły.`}
          </Alert>
        )}
        {flash?.kind === "saved" && (
          <Alert tone="success" title="Zapisano.">
            {`Pomysł nr ${idea.id} jest zapisany. Możesz poprosić asystenta o podpowiedź albo rozwinąć pomysł na kanwie.`}
          </Alert>
        )}
        {flash?.kind === "submit_error" && (
          <Alert tone="danger" title="Nie udało się wysłać.">
            {`Pomysł nr ${idea.id} jest zapisany, ale nie trafił jeszcze do Hubu (${flash.message}). Spróbuj wysłać go ponownie.`}
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <IdeaForm ref={formRef} initial={formValues} idea={idea} onSaved={handleSaved} />
        </div>
        <aside aria-label="Stan pomysłu i asystent" className="flex min-w-0 flex-col gap-8">
          <IdeaStatusCard idea={idea} headingLevel={2} />
          <AssistPanel
            ideaId={idea.id}
            target="idea"
            headingLevel={2}
            onAccept={(s) => formRef.current?.applySuggestion(s.field, s.value)}
          />
        </aside>
      </div>

      <SimilarInnovations ideaId={idea.id} refreshKey={idea.updated_at} headingLevel={2} />
    </>
  );
}
