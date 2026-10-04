import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "@/api/client";
import type { CallDetail, GrantApplicationCheck, GrantApplicationDetail, GrantApplicationPatch, IdeaDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { BudgetRows, completeRows, formatMoney, toDraftRows, type BudgetRowDraft } from "@/components/application/BudgetRows";
import { SectionEditor } from "@/components/application/SectionEditor";
import { LoadState } from "@/components/LoadState";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate, formatDateTime } from "@/lib/format";

/** Opóźnienie autozapisu po ostatniej zmianie (jak w kanwie). */
const AUTOSAVE_DELAY_MS = 800;

const PRINT_FOOTER = "Wygenerowano w Kreatorze pomysłów — dokument roboczy, nie stanowi wniosku w naborze ROPS";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface Loaded {
  app: GrantApplicationDetail;
  call: CallDetail;
  idea: IdeaDetail | null;
}

/** Rozbija komunikat 422 `answers.<id>: …` / `budget…: …` na miejsce i treść. */
function splitFieldError(message: string): { field: string; text: string } | null {
  const m = /^(answers\.([\w-]+)|budget[\w.]*):\s*(.*)$/s.exec(message);
  if (!m) return null;
  return { field: m[2] ?? "budget", text: m[3] ?? "" };
}

function ideaTitleOf({ app, idea }: Loaded): string {
  return idea?.title ?? `Pomysł nr ${app.idea_id}`;
}

function sectionAnchor(sectionId: string | null): string {
  return sectionId ? `sekcja-${sectionId}` : "sekcja-budzet";
}

/** Przewija do sekcji i przenosi na nią fokus (nagłówek ma tabIndex=-1). */
function goToSection(e: MouseEvent<HTMLAnchorElement>, anchor: string) {
  const target = document.getElementById(anchor);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ block: "start" });
  target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
}

export function ApplicationPage() {
  const params = useParams();
  const id = Number(params.id);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  useDocumentTitle(loaded?.idea ? `Wniosek: ${loaded.idea.title}` : "Wniosek");

  useEffect(() => {
    let active = true;
    setLoaded(null);
    setLoadError(null);
    if (!Number.isInteger(id) || id <= 0) {
      setLoadError(new ApiError(404, "NOT_FOUND", "Nie ma takiego wniosku."));
      return;
    }
    (async () => {
      const app = await api.grantApplication(id);
      const [call, idea] = await Promise.all([api.call(app.call_id), api.idea(app.idea_id).catch(() => null)]);
      return { app, call, idea };
    })().then(
      (data) => {
        if (active) setLoaded(data);
      },
      (err: unknown) => {
        if (active) setLoadError(toApiError(err));
      },
    );
    return () => {
      active = false;
    };
  }, [id, tick]);

  return (
    <div
      className={[
        "ds-page print:block print:max-w-none print:p-0",
        // Wydruk: ukryj ramę serwisu (link „Przejdź do treści”, baner, nawigację, stopkę) — tylko na tej stronie.
        "print:[body:has(&)_.ds-skip-link]:hidden print:[body:has(&)_.ds-header]:hidden print:[body:has(&)_.ds-footer]:hidden",
      ].join(" ")}
    >
      <header className="flex flex-col gap-6 print:hidden">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Wniosek do naboru
          </h1>
          {loaded && (
            <>
              <p className="m-0 text-body-lg text-ink">{loaded.call.title}</p>
              <p className="m-0 text-body text-ink">
                Pomysł:{" "}
                <Link to={`/mam-pomysl/${loaded.app.idea_id}`} className="text-navy">
                  {ideaTitleOf(loaded)}
                </Link>
              </p>
            </>
          )}
        </div>
        <KreatorNav />
      </header>
      <LoadState
        loading={!loaded && !loadError}
        error={loadError}
        onRetry={() => setTick((t) => t + 1)}
        label="Wczytujemy wniosek…"
      >
        {loaded && <ApplicationEditor key={loaded.app.id} {...loaded} />}
      </LoadState>
    </div>
  );
}

function ApplicationEditor({ app, call, idea }: Loaded) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...app.answers }));
  const [rows, setRows] = useState<BudgetRowDraft[]>(() => toDraftRows(app.budget));
  const [checks, setChecks] = useState<GrantApplicationCheck[]>(app.checks);
  const [updatedAt, setUpdatedAt] = useState(app.updated_at);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const answersRef = useRef(answers);
  const rowsRef = useRef(rows);
  const dirtyRef = useRef<Set<string>>(new Set());
  const budgetDirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const aliveRef = useRef(true);

  const textSections = call.sections.filter((s) => s.kind === "text");

  /** Wysyła zaległe zmiany (jeden PATCH naraz, po kolei). */
  const save = useCallback((): Promise<void> => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const run = async () => {
      const keys = [...dirtyRef.current];
      const budgetDirty = budgetDirtyRef.current;
      if (keys.length === 0 && !budgetDirty) return;
      dirtyRef.current = new Set();
      budgetDirtyRef.current = false;
      const patch: GrantApplicationPatch = {};
      if (keys.length) {
        patch.answers = Object.fromEntries(keys.map((k) => [k, answersRef.current[k] ? answersRef.current[k] : null]));
      }
      if (budgetDirty) patch.budget = completeRows(rowsRef.current);
      if (aliveRef.current) setStatus("saving");
      try {
        const res = await api.patchGrantApplication(app.id, patch);
        if (!aliveRef.current) return;
        setChecks(res.checks);
        setUpdatedAt(res.updated_at);
        setSaveError(null);
        setFieldErrors((errs) => {
          const next = { ...errs };
          for (const k of keys) delete next[k];
          if (budgetDirty) delete next.budget;
          return next;
        });
        const stillDirty = dirtyRef.current.size > 0 || budgetDirtyRef.current;
        setStatus(stillDirty ? "pending" : "saved");
      } catch (err) {
        const e = toApiError(err);
        // Niezapisane pola wracają do kolejki — kolejna zmiana spróbuje ponownie.
        for (const k of keys) dirtyRef.current.add(k);
        if (budgetDirty) budgetDirtyRef.current = true;
        if (!aliveRef.current) return;
        const field = e.status === 422 ? splitFieldError(e.message) : null;
        if (field) {
          setFieldErrors((errs) => ({ ...errs, [field.field]: field.text }));
          setSaveError(null);
        } else {
          setSaveError(e);
        }
        setStatus("error");
      }
    };
    chainRef.current = chainRef.current.then(run, run);
    return chainRef.current;
  }, [app.id]);

  const schedule = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setStatus("pending");
    timerRef.current = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
  }, [save]);

  // Zapis zaległych zmian przy opuszczeniu strony (bez czekania na odpowiedź).
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      void save();
    };
  }, [save]);

  function setAnswer(sectionId: string, value: string) {
    const next = { ...answersRef.current, [sectionId]: value };
    answersRef.current = next;
    setAnswers(next);
    dirtyRef.current.add(sectionId);
    schedule();
  }

  function changeRows(next: BudgetRowDraft[]) {
    rowsRef.current = next;
    setRows(next);
    budgetDirtyRef.current = true;
    schedule();
  }

  async function print() {
    await save();
    window.print();
  }

  const ideaTitle = ideaTitleOf({ app, call, idea });
  const printRows = completeRows(rows);
  const printTotal = printRows.reduce((sum, r) => sum + r.cost, 0);

  const statusText: Record<SaveStatus, string> = {
    idle: `Ostatni zapis: ${formatDateTime(updatedAt)}`,
    pending: "Masz niezapisane zmiany…",
    saving: "Zapisujemy…",
    saved: "Wszystkie zmiany zapisane",
    error: "Nie udało się zapisać zmian",
  };

  return (
    <>
      {/* ---------- Widok ekranowy ---------- */}
      <div className="flex flex-col gap-8 print:hidden">

        <div className="flex flex-col gap-4">
          <Alert tone="info" title="Dokument roboczy.">
            Część odpowiedzi wypełniliśmy na podstawie fiszki i kanwy. Wniosek złożysz w naborze ROPS — tu przygotujesz
            i wydrukujesz jego treść.
          </Alert>
          {!call.is_open && (
            <Alert tone="warning">Ten nabór jest zakończony. Możesz dalej edytować i wydrukować wniosek.</Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1">
              <div className="flex gap-2">
                <dt className="text-label text-ink-muted">Kwota grantu</dt>
                <dd className="m-0 text-body text-ink">do {formatMoney(call.max_amount)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-label text-ink-muted">Termin</dt>
                <dd className="m-0 text-body text-ink">do {formatDate(call.closes_at)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-4">
              <p className="m-0 text-small text-ink-muted">{statusText[status]}</p>
              <button type="button" className="ds-btn ds-btn--cta" onClick={() => void print()}>
                Drukuj / zapisz PDF
              </button>
            </div>
          </div>
          {saveError && (
            <div role="alert">
              <Alert tone="danger" title="Nie udało się zapisać zmian.">
                <p>{saveError.message}</p>
                <p>
                  <button type="button" className="ds-btn ds-btn--small" onClick={() => void save()}>
                    Spróbuj ponownie
                  </button>
                </p>
              </Alert>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex flex-col gap-6 lg:sticky lg:top-4 lg:w-80 lg:shrink-0">
            <nav aria-labelledby="wniosek-spis" className="flex flex-col gap-2">
              <h2 id="wniosek-spis" className="m-0 font-sans text-h3 text-navy">
                Spis sekcji
              </h2>
              <ol className="m-0 flex flex-col gap-1 pl-6">
                {call.sections.map((s) => {
                  const filled = s.kind === "info" || Boolean(answers[s.id]?.trim());
                  return (
                    <li key={s.id} className="text-body">
                      <a href={`#${sectionAnchor(s.id)}`} className="text-navy" onClick={(e) => goToSection(e, sectionAnchor(s.id))}>
                        {s.title}
                      </a>
                      {s.kind === "text" && !filled && s.required && (
                        <span className="text-small text-ink-muted"> — do uzupełnienia</span>
                      )}
                    </li>
                  );
                })}
                <li className="text-body">
                  <a href="#sekcja-budzet" className="text-navy" onClick={(e) => goToSection(e, "sekcja-budzet")}>
                    Plan działań i koszty
                  </a>
                </li>
              </ol>
            </nav>

            <section aria-labelledby="wniosek-kontrole" className="flex flex-col gap-2">
              <h2 id="wniosek-kontrole" className="m-0 font-sans text-h3 text-navy">
                Do poprawy
              </h2>
              {checks.length === 0 ? (
                <p className="m-0 flex items-center gap-2 text-body text-ink">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4 shrink-0 fill-none stroke-current text-success [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                  >
                    <polyline points="3 8.5 6.5 12 13 4.5" />
                  </svg>
                  Wszystkie wymagane sekcje są uzupełnione, a koszty mieszczą się w limicie.
                </p>
              ) : (
                <ul className="m-0 flex flex-col gap-2 pl-6">
                  {checks.map((c) => (
                    <li key={`${c.code}-${c.section_id ?? "budzet"}`} className="text-body text-ink">
                      <a
                        href={`#${sectionAnchor(c.section_id)}`}
                        className="text-navy"
                        onClick={(e) => goToSection(e, sectionAnchor(c.section_id))}
                      >
                        {c.message_pl}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {call.sections.map((s, i) => (
              <SectionEditor
                key={s.id}
                applicationId={app.id}
                section={s}
                index={i + 1}
                value={answers[s.id] ?? ""}
                onChange={(v) => setAnswer(s.id, v)}
                error={fieldErrors[s.id]}
                statements={call.statements}
                flush={save}
              />
            ))}
            <BudgetRows rows={rows} onChange={changeRows} maxAmount={call.max_amount} error={fieldErrors.budget} />
            {textSections.length === 0 && (
              <Alert tone="info">Ten nabór nie ma pytań w Kreatorze. Skorzystaj z dokumentów ROPS na stronie naborów.</Alert>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Wersja do druku (A4) ---------- */}
      <div className="hidden text-ink print:block">
        <p className="m-0 text-small text-ink-muted">Kreator pomysłów · dokument roboczy</p>
        <p className="mb-2 mt-4 font-sans text-h1 text-ink">{call.title}</p>
        <p className="m-0 text-body-lg text-ink">
          <strong>Pomysł:</strong> {ideaTitle}
        </p>
        <p className="m-0 text-body text-ink">
          Kwota grantu do {formatMoney(call.max_amount)} · termin naboru {formatDate(call.opens_at)} – {formatDate(call.closes_at)}
        </p>

        {call.sections.map((s, i) => (
          <div key={s.id} className="mt-6 break-inside-avoid-page">
            <p className="m-0 font-sans text-h3 text-ink">
              {i + 1}. {s.title}
            </p>
            {s.kind === "info" ? (
              <>
                <p className="mb-0 mt-2 text-body text-ink">{s.prompt}</p>
                {s.id === "statements" && call.statements.length > 0 && (
                  <ul className="mb-0 mt-2 pl-6">
                    {call.statements.map((st) => (
                      <li key={st} className="text-body text-ink">
                        {st}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="mb-0 mt-2 text-small italic text-ink-muted">{s.prompt}</p>
                <p className="mb-0 mt-2 whitespace-pre-line text-body text-ink [overflow-wrap:anywhere]">
                  {answers[s.id]?.trim() ? answers[s.id] : "Brak odpowiedzi."}
                </p>
              </>
            )}
          </div>
        ))}

        <div className="mt-6 break-inside-avoid-page">
          <p className="m-0 font-sans text-h3 text-ink">Plan działań i koszty</p>
          {printRows.length === 0 ? (
            <p className="mb-0 mt-2 text-body text-ink">Brak pozycji.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-body text-ink">
              <thead>
                <tr>
                  <th scope="col" className="border border-solid border-ink p-2 text-left">
                    Działanie
                  </th>
                  <th scope="col" className="border border-solid border-ink p-2 text-left">
                    Termin
                  </th>
                  <th scope="col" className="border border-solid border-ink p-2 text-right">
                    Koszt
                  </th>
                </tr>
              </thead>
              <tbody>
                {printRows.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-solid border-ink p-2">{r.action}</td>
                    <td className="border border-solid border-ink p-2">{r.when || "—"}</td>
                    <td className="whitespace-nowrap border border-solid border-ink p-2 text-right">{formatMoney(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2} className="border border-solid border-ink p-2 text-left">
                    Suma (limit naboru {formatMoney(call.max_amount)})
                  </th>
                  <td className="whitespace-nowrap border border-solid border-ink p-2 text-right font-bold">{formatMoney(printTotal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <p className="mb-0 mt-8 border-0 border-t border-solid border-line pt-2 text-small text-ink-muted">
          {PRINT_FOOTER}. Stan na {formatDateTime(updatedAt)}.
        </p>
      </div>
    </>
  );
}
