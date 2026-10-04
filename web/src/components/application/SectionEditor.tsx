import { Fragment, useId, useRef, useState, type ReactNode } from "react";
import { api, type ApiError } from "@/api/client";
import type { CallSection, DraftResponse } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { ASSIST_PRIVACY_NOTE } from "@/lib/labels";

/** Lustro `APPLICATION_TEXT_MAX_CHARS` z api/config.py — limit sekcji bez własnego `max_chars`. */
const APPLICATION_TEXT_MAX_CHARS = 6000;

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Tekst z adresami URL zamienionymi na linki (podpowiedzi naborów odsyłają do PDF-ów ROPS). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} className="text-navy [overflow-wrap:anywhere]">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

interface Props {
  applicationId: number;
  section: CallSection;
  /** Numer punktu (wzór naboru albo kolejność); `null` = podpunkt bez numeru. */
  number: string | null;
  value: string;
  onChange: (value: string) => void;
  /** Komunikat 422 dla tej sekcji (`answers.<id>: …`). */
  error?: string | null;
  /** Oświadczenia naboru — pokazywane w sekcji `statements`. */
  statements?: string[];
  /** Zapisz zaległe zmiany przed szkicem (szkic bierze bieżącą odpowiedź z bazy). */
  flush?: () => Promise<void>;
}

/** Limit znaków sekcji tekstowej: `max_chars` naboru albo ogólny limit backendu. */
export function sectionLimit(section: CallSection): number {
  return section.max_chars ?? APPLICATION_TEXT_MAX_CHARS;
}

/** Sekcja wniosku: pytania naboru, podpowiedzi, odpowiedź z licznikiem i szkic AI. Sekcje `info` tylko jako tekst. */
export function SectionEditor({ applicationId, section, number, value, onChange, error, statements = [], flush }: Props) {
  const headingId = useId();
  const fieldId = useId();
  const promptId = useId();
  const hintsId = useId();
  const counterId = useId();
  const errorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftButtonRef = useRef<HTMLButtonElement>(null);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [draftError, setDraftError] = useState<ApiError | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const heading = (
    <h2 id={headingId} tabIndex={-1} className="m-0 font-sans text-h3 text-navy">
      {number ? `${number}. ` : ""}
      {section.title}
    </h2>
  );

  if (section.kind === "info") {
    return (
      <section id={`sekcja-${section.id}`} aria-labelledby={headingId} className="ds-card flex scroll-mt-4 flex-col gap-3">
        {heading}
        <p className="m-0 text-body text-ink">{section.prompt}</p>
        {section.id === "statements" && statements.length > 0 && (
          <ul className="m-0 flex flex-col gap-1 pl-6">
            {statements.map((s) => (
              <li key={s} className="text-body text-ink">
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const max = sectionLimit(section);
  const length = value.length;
  const nearLimit = length >= max * 0.9;
  const describedBy = [promptId, section.hints.length ? hintsId : null, counterId, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  async function writeDraft() {
    if (drafting) return;
    setDrafting(true);
    setDraftError(null);
    setDraft(null);
    setAnnouncement("");
    try {
      await flush?.();
      const res = await api.draftSection(applicationId, section.id);
      setDraft(res);
      setAnnouncement(res.available ? "Szkic jest gotowy. Przeczytaj go i zdecyduj, czy go wstawić." : "Asystent AI jest teraz niedostępny.");
    } catch (err) {
      setDraftError(toApiError(err));
    } finally {
      setDrafting(false);
    }
  }

  function insertDraft() {
    if (!draft) return;
    onChange(draft.text.slice(0, max));
    setDraft(null);
    setAnnouncement("Wstawiono szkic do odpowiedzi.");
    textareaRef.current?.focus();
  }

  function skipDraft() {
    setDraft(null);
    draftButtonRef.current?.focus();
  }

  let draftView: ReactNode = null;
  if (draft && !draft.available) {
    draftView = (
      <Alert tone="info">
        {draft.message_pl ?? "Asystent AI jest teraz niedostępny. Skorzystaj z pytań przy sekcji."}
      </Alert>
    );
  } else if (draft && draft.available) {
    draftView = (
      <div className="flex flex-col gap-3 rounded-md border border-solid border-line bg-surface-muted p-4">
        <p className="m-0 text-label text-ink">Szkic asystenta</p>
        <p className="m-0 whitespace-pre-line text-body text-ink [overflow-wrap:anywhere]">{draft.text}</p>
        <p className="m-0 text-small text-ink-muted">„Wstaw” zastąpi obecną odpowiedź w tej sekcji. Sprawdź fakty przed wysłaniem.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ds-btn ds-btn--small" onClick={insertDraft}>
            Wstaw
          </button>
          <button type="button" className="ds-btn ds-btn--link ds-btn--small" onClick={skipDraft}>
            Pomiń
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id={`sekcja-${section.id}`} aria-labelledby={headingId} className="ds-card flex scroll-mt-4 flex-col gap-3">
      {heading}
      <p id={promptId} className="m-0 text-body text-ink">
        {section.prompt}
      </p>
      {section.hints.length > 0 && (
        <ul id={hintsId} className="m-0 flex flex-col gap-1 pl-6">
          {section.hints.map((hint) => (
            <li key={hint} className="text-small text-ink-muted">
              <Linkified text={hint} />
            </li>
          ))}
        </ul>
      )}

      <div className="ds-field">
        <label htmlFor={fieldId} className="ds-label">
          Twoja odpowiedź{section.required ? " (wymagane)" : " (opcjonalne)"}
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          className="ds-textarea"
          rows={section.max_chars !== null && section.max_chars <= 300 ? 2 : 8}
          value={value}
          maxLength={max}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <p id={counterId} className="ds-counter" data-state={nearLimit ? "limit" : undefined}>
          {length} / {max} znaków
        </p>
        {error && (
          <p id={errorId} className="ds-error m-0">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <button
            ref={draftButtonRef}
            type="button"
            className="ds-btn"
            onClick={() => void writeDraft()}
            aria-busy={drafting}
            aria-disabled={drafting}
          >
            {drafting ? "Asystent pisze szkic…" : "Napisz szkic"}
          </button>
        </div>
        <p className="m-0 text-small text-ink-muted">{ASSIST_PRIVACY_NOTE}</p>
      </div>
      <p className="ds-sr-only" aria-live="polite">
        {announcement}
      </p>
      {draftError && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się napisać szkicu.">
            {draftError.message}
          </Alert>
        </div>
      )}
      {draftView}
    </section>
  );
}
