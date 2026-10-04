import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { AssistSuggestion, BlockValue, CanvasDefinition, IdeaDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { CanvasProgressBar, percentOf } from "@/components/canvas/CanvasProgressBar";
import { BlockStep, SheetIntro, SheetSummary, StepProgress } from "@/components/canvas/CanvasStep";
import { SheetMap } from "@/components/canvas/SheetMap";
import { INTRO_STEP, allBlockIds, buildSheetSteps, isBlockFilled, parseStep, stepHref, type CanvasStep } from "@/components/canvas/steps";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError, useApi } from "@/hooks/useApi";
import { appendEntry, useCanvas, type CanvasSave } from "@/hooks/useCanvas";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { IDEA_STATUS_LABELS } from "@/lib/labels";

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** `?arkusz=1|2|3` → indeks arkusza (0–2); wartość spoza zakresu = pierwszy arkusz. */
function parseSheet(raw: string | null, count: number): number {
  const n = raw && /^\d+$/.test(raw) ? Number(raw) : 1;
  return n >= 1 && n <= count ? n - 1 : 0;
}

function timeOf(d: Date): string {
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Wskaźnik autozapisu. Stan „Zapisywanie…” / „Zapisano o GG:MM” nie jest ogłaszany (zmienia się przy każdej
 * zmianie), ogłaszany jest tylko błąd — grzecznie, przez region `aria-live`, który jest w DOM od początku.
 */
function SaveIndicator({ save, onRetry }: { save: CanvasSave; onRetry: () => void }) {
  let text = "Zmiany zapisują się automatycznie.";
  if (save.status === "saving") text = "Zapisywanie…";
  else if (save.savedAt) text = `Zapisano o ${timeOf(save.savedAt)}`;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {save.status !== "error" && (
        <p className="m-0 inline-flex items-center gap-2 text-body text-ink" aria-busy={save.status === "saving"}>
          {save.status === "saving" ? (
            <span className="ds-spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5 fill-none stroke-current text-navy [stroke-width:2]">
              <polyline points="5 12.5 10 17.5 19 7.5" />
            </svg>
          )}
          {text}
        </p>
      )}
      <div aria-live="polite">
        {save.status === "error" && save.error && (
          <Alert tone="danger" title="Nie zapisano zmian.">
            <p>{save.error.message} Zmiany są na tej stronie, dopóki jej nie zamkniesz.</p>
            <p>
              <button type="button" className="ds-btn ds-btn--small" onClick={onRetry}>
                Spróbuj ponownie
              </button>
            </p>
          </Alert>
        )}
      </div>
    </div>
  );
}

type SubmitState = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "done" };

function stepTitle(step: CanvasStep | undefined, sheetNo: number): string {
  if (!step) return "";
  if (step.kind === "block") return step.block.title;
  return step.kind === "intro" ? `Wstęp arkusza ${sheetNo}` : `Podsumowanie arkusza ${sheetNo}`;
}

interface StepTarget {
  href: string;
  label: string;
}

/** Poprzedni i następny krok; na granicy arkuszy — podsumowanie poprzedniego / wstęp następnego arkusza. */
function neighbours(
  def: CanvasDefinition,
  sheetIndex: number,
  steps: CanvasStep[],
  index: number,
  blocks: Record<string, BlockValue | undefined>,
): { prev: StepTarget | null; next: StepTarget | null } {
  const sheetNo = sheetIndex + 1;
  const sheets = def.sheets;
  let prev: StepTarget | null = null;
  let next: StepTarget | null = null;
  if (index > 0) {
    const s = steps[index - 1];
    if (s) prev = { href: stepHref(sheetNo, s.id), label: stepTitle(s, sheetNo) };
  } else if (sheetIndex > 0) {
    prev = { href: stepHref(sheetNo - 1, "podsumowanie"), label: `Podsumowanie arkusza ${sheetNo - 1}` };
  }
  const current = steps[index];
  if (current?.kind === "intro") {
    // Wstęp prowadzi do pierwszego pustego pola (albo do pierwszego, gdy wszystko uzupełnione).
    const blockSteps = steps.filter((s): s is Extract<CanvasStep, { kind: "block" }> => s.kind === "block");
    const target = blockSteps.find((s) => !isBlockFilled(s.block, blocks[s.id])) ?? blockSteps[0];
    if (target) next = { href: stepHref(sheetNo, target.id), label: `Zacznij: ${target.block.title}` };
  } else if (index < steps.length - 1) {
    const s = steps[index + 1];
    if (s) next = { href: stepHref(sheetNo, s.id), label: `Dalej: ${stepTitle(s, sheetNo)}` };
  } else if (sheetIndex < sheets.length - 1) {
    next = { href: stepHref(sheetNo + 1, INTRO_STEP), label: `Następny arkusz: ${sheets[sheetIndex + 1]?.title ?? ""}` };
  }
  return { prev, next };
}

export function CanvasPage() {
  const { id: rawId } = useParams();
  const ideaId = parseId(rawId);
  const [params] = useSearchParams();
  const idea = useApi<IdeaDetail>(() => (ideaId ? api.idea(ideaId) : Promise.reject(new Error("bad id"))), [ideaId]);
  const canvas = useCanvas(ideaId ?? 0);
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const submitMsgRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");

  const title = idea.data?.title ?? "";
  useDocumentTitle(title ? `Social Canvas: ${title}` : "Social Canvas");

  const def = canvas.definition;
  const sheets = def?.sheets ?? [];
  const sheetIndex = parseSheet(params.get("arkusz"), Math.max(sheets.length, 1));
  const sheet = sheets[sheetIndex];
  const sheetNo = sheetIndex + 1;
  const steps = def && sheet ? buildSheetSteps(def, sheet) : [];
  const stepIndex = parseStep(params.get("krok"), steps);
  const step = steps[stepIndex];
  const stepKey = step ? `${sheetIndex}:${step.id}` : "";

  // Zmiana kroku: fokus na nagłówek kroku i grzeczny komunikat (pierwsze wczytanie — bez przenoszenia fokusu).
  const lastStepKey = useRef<string | null>(null);
  useEffect(() => {
    if (!stepKey) return;
    const prev = lastStepKey.current;
    lastStepKey.current = stepKey;
    if (prev === null || prev === stepKey) return;
    headingRef.current?.focus();
    setAnnounce(`Arkusz ${sheetNo}, krok ${stepIndex + 1} z ${steps.length}: ${stepTitle(step, sheetNo)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagujemy tylko na zmianę kroku
  }, [stepKey]);

  function acceptSuggestion(blockId: string, s: AssistSuggestion) {
    const block = def?.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const res = appendEntry(block, canvas.blocks[blockId], s.value);
    if ("error" in res) {
      canvas.setBlockError(blockId, res.error);
      return;
    }
    canvas.setBlock(blockId, res.value);
  }

  async function sendToHub() {
    if (!ideaId || submit.kind === "sending") return;
    setSubmit({ kind: "sending" });
    await canvas.flush();
    try {
      await api.submitIdea(ideaId);
      setSubmit({ kind: "done" });
      idea.reload();
    } catch (err) {
      setSubmit({ kind: "error", message: toApiError(err).message });
    }
    // Przycisk znika po wysłaniu — fokus na komunikat, żeby nie zgubić miejsca.
    window.setTimeout(() => submitMsgRef.current?.focus(), 0);
  }

  const notFound = ideaId === null || idea.error?.status === 404 || canvas.loadError?.status === 404;

  const whatNext = (
    <section aria-labelledby="canvas-send" className="flex max-w-3xl flex-col gap-3 rounded-lg border border-solid border-line p-4">
      <h3 id="canvas-send" className="m-0 font-sans text-h3 text-navy">
        Co dalej?
      </h3>
      {idea.data?.status === "DRAFT" ? (
        <>
          <p className="m-0 text-body text-ink">
            Kanwę możesz uzupełniać także po wysłaniu. Zespół Hubu zobaczy fiszkę i mapę pomysłu.
          </p>
          <div>
            <button
              type="button"
              className="ds-btn ds-btn--cta"
              onClick={() => void sendToHub()}
              aria-disabled={submit.kind === "sending"}
              aria-busy={submit.kind === "sending"}
            >
              {submit.kind === "sending" ? "Wysyłamy…" : "Wyślij do Hubu"}
            </button>
          </div>
        </>
      ) : (
        idea.data && (
          <p className="m-0 text-body text-ink">
            {`Status pomysłu: ${IDEA_STATUS_LABELS[idea.data.status]}. Zmiany na kanwie zespół Hubu zobaczy od razu.`}
          </p>
        )
      )}
      <div ref={submitMsgRef} tabIndex={-1} aria-live="polite">
        {submit.kind === "done" && <Alert tone="success" title="Wysłano do Hubu.">Odpowiedź zobaczysz w „Moich pomysłach”.</Alert>}
        {submit.kind === "error" && (
          <Alert tone="danger" title="Nie udało się wysłać.">
            <p>{submit.message}</p>
            <p>
              <Link to={`/mam-pomysl/${ideaId}`}>Uzupełnij fiszkę pomysłu</Link>
            </p>
          </Alert>
        )}
      </div>
    </section>
  );

  let body = null;
  if (def && sheet && step && canvas.progress && ideaId !== null) {
    const order = allBlockIds(def);
    const { prev, next } = neighbours(def, sheetIndex, steps, stepIndex, canvas.blocks);
    const questionText =
      step.kind === "block" ? `Pytanie ${order.indexOf(step.id) + 1} z ${order.length} na całej kanwie` : undefined;
    body = (
      <div className="flex min-w-0 flex-col gap-6">
        <nav aria-label="Arkusze Social Canvas">
          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {sheets.map((s, i) => {
              const active = i === sheetIndex;
              const p = canvas.progress?.by_sheet[s.id];
              return (
                <li key={s.id} className="min-w-0">
                  <Link
                    to={stepHref(i + 1, INTRO_STEP)}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-full flex-col gap-1 rounded-md border border-solid px-2 py-2 text-navy md:px-3 no-underline hover:bg-surface-sunken ${
                      active ? "border-navy bg-surface-muted shadow-[inset_0_-4px_0_var(--accent)]" : "border-line"
                    }`}
                  >
                    <span className="font-sans text-label [overflow-wrap:anywhere] md:text-nav">
                      {`Arkusz ${i + 1}`}
                      <span className="sr-only md:not-sr-only">{`: ${s.title}`}</span>
                    </span>
                    {p && <CanvasProgressBar label={`Arkusz ${i + 1}`} filled={p.filled} total={p.total} compact />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <p className="m-0 text-body text-ink">
            <strong>Cała mapa:</strong>
            {` ${canvas.progress.filled} z ${canvas.progress.total} pól (${percentOf(canvas.progress.filled, canvas.progress.total)}%)`}
          </p>
          <SaveIndicator save={canvas.save} onRetry={() => void canvas.flush()} />
        </div>

        <SheetMap definition={def} sheet={sheet} sheetNo={sheetNo} blocks={canvas.blocks} currentStep={step.id} />

        <div className={`flex min-w-0 flex-col gap-6 ${step.kind === "summary" ? "" : "max-w-4xl"}`}>
          <StepProgress steps={steps} index={stepIndex} sheetNo={sheetNo} blocks={canvas.blocks} questionText={questionText} />

          {step.kind === "intro" && (
            <SheetIntro definition={def} sheet={sheet} sheetNo={sheetNo} blocks={canvas.blocks} headingRef={headingRef} />
          )}
          {step.kind === "block" && (
            <BlockStep
              key={step.id}
              block={step.block}
              area={step.area}
              value={canvas.blocks[step.id]}
              onChange={(v) => canvas.setBlock(step.id, v)}
              error={canvas.blockErrors[step.id] ?? null}
              headingRef={headingRef}
              ideaId={ideaId}
              onAssist={acceptSuggestion}
            />
          )}

          {step.kind === "summary" && (
            <SheetSummary definition={def} sheet={sheet} sheetNo={sheetNo} blocks={canvas.blocks} headingRef={headingRef}>
              {whatNext}
            </SheetSummary>
          )}

          <nav aria-label="Kroki kanwy" className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-line pt-4">
            {prev ? (
              <Link className="ds-btn" to={prev.href}>
                Wstecz
                <span className="ds-sr-only">{`: ${prev.label}`}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link className="ds-btn ds-btn--primary [overflow-wrap:anywhere]" to={next.href}>
                {next.label}
              </Link>
            )}
          </nav>
        </div>

        <p className="m-0 max-w-3xl text-small text-ink">
          Wzór planszy:{" "}
          <a href={def.source_url} target="_blank" rel="noreferrer">
            Social Innovation Canvas (PDF, otwiera się w nowej karcie)
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Social Canvas
          </h1>
          {idea.data && (
            <p className="m-0 text-body-lg text-ink [overflow-wrap:anywhere]">
              Pomysł: <strong>{idea.data.title}</strong>
              <span className="ds-tag ml-2 align-middle">{IDEA_STATUS_LABELS[idea.data.status]}</span>
            </p>
          )}
          {ideaId !== null && (
            <p className="m-0">
              <Link className="ds-btn ds-btn--link px-0" to={`/mam-pomysl/${ideaId}`}>
                Wróć do fiszki
              </Link>
            </p>
          )}
        </div>
        <KreatorNav />
      </header>

      <div className="ds-sr-only" aria-live="polite">
        {announce}
      </div>

      {notFound ? (
        <Alert tone="info" title="Nie znaleziono pomysłu.">
          <p>Sprawdź numer pomysłu albo przejdź do listy.</p>
          <p>
            <Link to="/moje-pomysly">Moje pomysły</Link>
          </p>
        </Alert>
      ) : (
        <LoadState loading={canvas.loading} error={canvas.loadError} onRetry={canvas.reload} label="Wczytujemy kanwę…">
          {body}
        </LoadState>
      )}
    </div>
  );
}
