import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { KnowledgeType, SolutionAdminDetail, SolutionKind } from "@/api/types";
import { Alert, type AlertTone } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import {
  SolutionForm,
  fieldErrorFromApi,
  fromFormValues,
  toFormValues,
  type SolutionFormErrors,
  type SolutionFormValues,
} from "@/components/panel/SolutionForm";
import { toApiError, useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { refreshInbox } from "@/hooks/useInboxCount";
import { formatDateTime, plural } from "@/lib/format";
import { KIND_LABELS, KNOWLEDGE_TYPE_LABELS, SOLUTION_STATUS_LABELS } from "@/lib/labels";

interface Notice {
  tone: AlertTone;
  text: string;
}

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Komunikat po nieudanym zapisie + błędy przypięte do pól. */
function saveFailure(err: ApiError): { notice: Notice; errors: SolutionFormErrors } {
  if (err.status === 503) {
    return {
      notice: {
        tone: "danger",
        text: "Nie udało się odświeżyć wyszukiwania, zmiany nie zostały zapisane. Spróbuj za chwilę.",
      },
      errors: {},
    };
  }
  const errors = fieldErrorFromApi(err);
  if (Object.keys(errors).length) return { notice: { tone: "danger", text: "Popraw zaznaczone pola." }, errors };
  return { notice: { tone: "danger", text: err.message }, errors: {} };
}

function savedMessage(res: SolutionAdminDetail): string {
  if (!res.reembedded) return "Zapisano zmiany w opisie wpisu.";
  const n = res.chunk_count;
  return `Zapisano. Wyszukiwanie zaktualizowane (${n} ${plural(n, "fragment", "fragmenty", "fragmentów")}).`;
}

/** Alert komunikatu; po pojawieniu się dostaje fokus, żeby czytnik go przeczytał. */
function NoticeAlert({ notice }: { notice: Notice | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (notice) ref.current?.focus();
  }, [notice]);
  if (!notice) return null;
  return (
    <div ref={ref} tabIndex={-1} role={notice.tone === "danger" ? "alert" : "status"} className="outline-none">
      <Alert tone={notice.tone}>{notice.text}</Alert>
    </div>
  );
}

function SubmitBar({ label, saving }: { label: string; saving: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" className="ds-btn ds-btn--cta" aria-disabled={saving ? true : undefined}>
        {saving ? "Zapisywanie…" : label}
      </button>
      {saving && (
        <span role="status" className="text-body text-ink-muted">
          Zapisujemy i odświeżamy wyszukiwanie…
        </span>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <p className="m-0">
      <Link to="/panel/wiedza">← Baza wiedzy</Link>
    </p>
  );
}

/** Panel: edycja (`/panel/wiedza/:id`) albo dodanie wpisu (`/panel/wiedza/nowy`). */
export function KnowledgeEditPage() {
  const { id: raw } = useParams();
  if (raw === "nowy") return <CreateView />;
  const id = parseId(raw);
  return <EditView key={raw} id={id} />;
}

function EditView({ id }: { id: number | null }) {
  const { data, error, loading, reload } = useApi<SolutionAdminDetail>(
    () => (id === null ? Promise.reject(new ApiError(404, "NOT_FOUND", "Nie znaleziono wpisu.")) : api.adminSolution(id)),
    [id],
  );
  const notFound = error?.status === 404;
  useDocumentTitle(data ? `Edycja: ${data.title}` : "Edycja wpisu");

  return (
    <div className="ds-page">
      {notFound ? (
        <>
          <div className="ds-stack">
            <ModuleLabel module="panel" />
            <h1 tabIndex={-1}>Nie znaleziono wpisu</h1>
          </div>
          <div role="status">
            <EmptyState title="Nie znaleziono wpisu.">
              <p>
                <Link to="/panel/wiedza">Wróć do bazy wiedzy</Link>
              </p>
            </EmptyState>
          </div>
        </>
      ) : (
        <LoadState loading={loading && !data} error={error} onRetry={reload} label="Wczytujemy wpis…">
          {data && <EditForm key={data.id} initial={data} />}
        </LoadState>
      )}
    </div>
  );
}

function EditForm({ initial }: { initial: SolutionAdminDetail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(initial);
  const [values, setValues] = useState<SolutionFormValues>(() => toFormValues(initial));
  const [errors, setErrors] = useState<SolutionFormErrors>({});
  const [saving, setSaving] = useState(false);
  // Komunikat przekazany po dodaniu wpisu (stan nawigacji) — pokazany raz.
  const [notice, setNotice] = useState<Notice | null>(() => {
    const message = (location.state as { message?: string } | null)?.message;
    return message ? { tone: "success", text: message } : null;
  });
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    setErrors({});
    try {
      const res = await api.updateAdminSolution(detail.id, fromFormValues(values));
      setDetail(res);
      setValues(toFormValues(res));
      setNotice({ tone: "success", text: savedMessage(res) });
    } catch (err: unknown) {
      const failure = saveFailure(toApiError(err));
      setErrors(failure.errors);
      setNotice(failure.notice);
    } finally {
      setSaving(false);
    }
  }

  const kindLabel =
    detail.kind === "KNOWLEDGE" && detail.knowledge_type
      ? `${KIND_LABELS.KNOWLEDGE}: ${KNOWLEDGE_TYPE_LABELS[detail.knowledge_type].toLowerCase()}`
      : KIND_LABELS[detail.kind];

  return (
    <>
      <header className="ds-stack">
        <BackLink />
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>{detail.title}</h1>
        <ul className="ds-meta">
          <li className="ds-meta__item">Rodzaj: {kindLabel}</li>
          <li className="ds-meta__item">Status: {SOLUTION_STATUS_LABELS[detail.status]}</li>
          <li className="ds-meta__item">Ostatnia zmiana: {formatDateTime(detail.updated_at)}</li>
        </ul>
        <div className="ds-cluster">
          {detail.status === "PUBLISHED" && (
            <Link className="ds-btn" to={`/rozwiazania/${detail.id}`}>
              Zobacz publicznie
            </Link>
          )}
          <Link className="ds-btn" to={`/panel/rozwiazania/${detail.id}`}>
            Decyzja o publikacji
          </Link>
        </div>
      </header>

      <NoticeAlert notice={notice} />

      <SolutionForm kind={detail.kind} values={values} onChange={setValues} errors={errors} onSubmit={save}>
        <SubmitBar label="Zapisz zmiany" saving={saving} />
      </SolutionForm>
    </>
  );
}

type CreateStatus = "PUBLISHED" | "PENDING_REVIEW";

function CreateView() {
  useDocumentTitle("Dodaj wpis");
  const navigate = useNavigate();
  const uid = useId();
  const [kind, setKind] = useState<SolutionKind>("SOLUTION");
  const [status, setStatus] = useState<CreateStatus>("PUBLISHED");
  const [values, setValues] = useState<SolutionFormValues>(() => toFormValues(null));
  const [errors, setErrors] = useState<SolutionFormErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  function chooseKind(next: SolutionKind) {
    setKind(next);
    const knowledgeType: KnowledgeType | null = next === "KNOWLEDGE" ? (values.knowledge_type ?? "REPORT") : null;
    setValues({ ...values, knowledge_type: knowledgeType });
  }

  async function create() {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    setErrors({});
    try {
      const res = await api.createAdminSolution({ ...fromFormValues(values), kind, status });
      if (status === "PENDING_REVIEW") void refreshInbox();
      navigate(`/panel/wiedza/${res.id}`, { state: { message: "Dodano wpis. Wyszukiwanie zaktualizowane." } });
    } catch (err: unknown) {
      const failure = saveFailure(toApiError(err));
      setErrors(failure.errors);
      setNotice(failure.notice);
      setSaving(false);
    }
  }

  const KINDS: { value: SolutionKind; label: string }[] = [
    { value: "SOLUTION", label: "Rozwiązanie" },
    { value: "KNOWLEDGE", label: "Wiedza — raport lub materiał" },
  ];
  const STATUSES: { value: CreateStatus; label: string }[] = [
    { value: "PUBLISHED", label: "Opublikuj od razu" },
    { value: "PENDING_REVIEW", label: "Zapisz do zatwierdzenia" },
  ];

  return (
    <div className="ds-page">
      <header className="ds-stack">
        <BackLink />
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1}>Dodaj wpis</h1>
        <p className="m-0">
          Wpis „Rozwiązanie” pojawia się na kartach w czacie. Wpis „Wiedza” podpowiada tylko kontekst — nie trafia na
          karty rozwiązań.
        </p>
      </header>

      <NoticeAlert notice={notice} />

      <div className="flex flex-wrap gap-8">
        <fieldset className="ds-choices">
          <legend className="ds-choices__legend">Rodzaj wpisu</legend>
          {KINDS.map((k) => (
            <label key={k.value} className="ds-choice">
              <input
                className="ds-choice__input"
                type="radio"
                name={`${uid}-kind`}
                value={k.value}
                checked={kind === k.value}
                onChange={() => chooseKind(k.value)}
              />
              {k.label}
            </label>
          ))}
        </fieldset>
        <fieldset className="ds-choices">
          <legend className="ds-choices__legend">Publikacja</legend>
          {STATUSES.map((s) => (
            <label key={s.value} className="ds-choice">
              <input
                className="ds-choice__input"
                type="radio"
                name={`${uid}-status`}
                value={s.value}
                checked={status === s.value}
                onChange={() => setStatus(s.value)}
              />
              {s.label}
            </label>
          ))}
        </fieldset>
      </div>

      <SolutionForm kind={kind} values={values} onChange={setValues} errors={errors} onSubmit={create}>
        <SubmitBar label="Dodaj" saving={saving} />
      </SolutionForm>
    </div>
  );
}
