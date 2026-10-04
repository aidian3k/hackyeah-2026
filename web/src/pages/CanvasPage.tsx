import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { AssistSuggestion, IdeaDetail } from "@/api/types";
import { Alert } from "@/components/Alert";
import { LoadState } from "@/components/LoadState";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { CanvasProgressBar } from "@/components/canvas/CanvasProgressBar";
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

export function CanvasPage() {
  const { id: rawId } = useParams();
  const ideaId = parseId(rawId);
  const [params] = useSearchParams();
  const idea = useApi<IdeaDetail>(() => (ideaId ? api.idea(ideaId) : Promise.reject(new Error("bad id"))), [ideaId]);
  const canvas = useCanvas(ideaId ?? 0);
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const submitMsgRef = useRef<HTMLDivElement>(null);

  const title = idea.data?.title ?? "";
  useDocumentTitle(title ? `Social Canvas: ${title}` : "Social Canvas");

  const def = canvas.definition;
  const sheets = def?.sheets ?? [];
  const sheetIndex = parseSheet(params.get("arkusz"), Math.max(sheets.length, 1));
  const sheet = sheets[sheetIndex];

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

      {notFound ? (
        <Alert tone="info" title="Nie znaleziono pomysłu.">
          <p>Sprawdź numer pomysłu albo przejdź do listy.</p>
          <p>
            <Link to="/moje-pomysly">Moje pomysły</Link>
          </p>
        </Alert>
      ) : (
        <LoadState
          loading={canvas.loading}
          error={canvas.loadError}
          onRetry={canvas.reload}
          label="Wczytujemy kanwę…"
        >
          {def && sheet && canvas.progress && ideaId !== null && (
            <div className="flex min-w-0 flex-col gap-6">
              <p className="m-0 max-w-3xl text-body text-ink">
                Rozwiń pomysł na trzech arkuszach: problem, odbiorcy, wartość, partnerzy i wpływ. Wzór planszy:{" "}
                <a href={def.source_url} target="_blank" rel="noreferrer">
                  Social Innovation Canvas (PDF, otwiera się w nowej karcie)
                </a>
                .
              </p>

              <nav aria-label="Arkusze Social Canvas">
                <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-3">
                  {sheets.map((s, i) => {
                    const active = i === sheetIndex;
                    const p = canvas.progress?.by_sheet[s.id];
                    return (
                      <li key={s.id} className="min-w-0">
                        <Link
                          to={`?arkusz=${i + 1}`}
                          aria-current={active ? "page" : undefined}
                          className={`flex h-full flex-col gap-1 rounded-md border border-solid px-3 py-2 text-navy no-underline hover:bg-surface-sunken ${
                            active ? "border-navy bg-surface-muted shadow-[inset_0_-4px_0_var(--accent)]" : "border-line"
                          }`}
                        >
                          <span className="font-sans text-nav [overflow-wrap:anywhere]">{`Arkusz ${i + 1}: ${s.title}`}</span>
                          {p && <CanvasProgressBar label={`Arkusz ${i + 1}`} filled={p.filled} total={p.total} compact />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Postęp i stan zapisu zostają widoczne przy przewijaniu długiego arkusza (od md; na telefonie zabierałyby ekran). */}
              <div className="grid grid-cols-1 items-start gap-4 border-0 border-b border-solid border-line bg-surface pb-3 md:sticky md:top-0 md:z-10 md:grid-cols-2 md:pt-3">
                <CanvasProgressBar label="Cała mapa" filled={canvas.progress.filled} total={canvas.progress.total} />
                <SaveIndicator save={canvas.save} onRetry={() => void canvas.flush()} />
              </div>

              <CanvasBoard
                definition={def}
                blocks={canvas.blocks}
                sheet={sheet.id}
                onBlockChange={canvas.setBlock}
                onAssist={acceptSuggestion}
                ideaId={ideaId}
                blockErrors={canvas.blockErrors}
              />

              <nav aria-label="Następny arkusz" className="flex flex-wrap gap-3">
                {sheetIndex > 0 && (
                  <Link className="ds-btn" to={`?arkusz=${sheetIndex}`}>
                    {`Poprzedni arkusz: ${sheets[sheetIndex - 1]?.title ?? ""}`}
                  </Link>
                )}
                {sheetIndex < sheets.length - 1 && (
                  <Link className="ds-btn" to={`?arkusz=${sheetIndex + 2}`}>
                    {`Następny arkusz: ${sheets[sheetIndex + 1]?.title ?? ""}`}
                  </Link>
                )}
              </nav>

              <section aria-labelledby="canvas-send" className="flex max-w-3xl flex-col gap-3">
                <h2 id="canvas-send" className="m-0 font-sans text-h2 text-navy">
                  Co dalej?
                </h2>
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
            </div>
          )}
        </LoadState>
      )}
    </div>
  );
}
