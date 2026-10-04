import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { BlockValue, CanvasBlock } from "@/api/types";

/** Lustro CANVAS_ITEM_MAX_CHARS (api/config.py): maks. długość jednego wpisu listy, „innych” i nazwy partnera. */
export const CANVAS_ITEM_MAX_CHARS = 300;
/** Lustro CANVAS_LIST_MAX_ITEMS (api/config.py): maks. liczba wpisów listy i własnych wpisów bloku `multi`. */
export const CANVAS_LIST_MAX_ITEMS = 12;

interface EntryAdderProps {
  /** Etykieta pola, np. „Dodaj wpis” albo „Dopisz własną”. */
  label: string;
  /** Wpisy już dodane — duplikat (bez względu na wielkość liter) nie jest dodawany. */
  existing: string[];
  onAdd: (entry: string) => void;
  /** Powód blokady (limit); gdy ustawiony, dodanie jest zablokowane i powód jest pokazany przy polu. */
  blockedReason?: string | null;
  buttonLabel?: string;
}

/** Pole z przyciskiem „Dodaj” (Enter też dodaje). Używane przez bloki `list` i `multi`. */
export function EntryAdder({ label, existing, onAdd, blockedReason = null, buttonLabel = "Dodaj" }: EntryAdderProps) {
  const inputId = useId();
  const hintId = useId();
  const blockedId = useId();
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add() {
    const entry = draft.trim();
    if (blockedReason) {
      setMessage("Nie można teraz dodać wpisu — limit jest osiągnięty.");
      return;
    }
    if (!entry) {
      setMessage("Wpisz treść, zanim dodasz.");
      inputRef.current?.focus();
      return;
    }
    if (existing.some((e) => e.toLocaleLowerCase("pl") === entry.toLocaleLowerCase("pl"))) {
      setMessage("Ten wpis już jest na liście.");
      inputRef.current?.focus();
      return;
    }
    onAdd(entry);
    setDraft("");
    setMessage("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  const describedBy = [blockedReason ? blockedId : "", message ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="ds-label">
        {label}
      </label>
      {blockedReason && (
        <p id={blockedId} className="ds-hint">
          {blockedReason}
        </p>
      )}
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="ds-input min-w-0 flex-1 basis-48"
          value={draft}
          maxLength={CANVAS_ITEM_MAX_CHARS}
          onChange={(e) => {
            setDraft(e.target.value);
            if (message) setMessage("");
          }}
          onKeyDown={onKeyDown}
          aria-describedby={describedBy}
        />
        <button type="button" className="ds-btn" onClick={add} aria-disabled={blockedReason ? true : undefined}>
          {buttonLabel}
        </button>
      </div>
      <p id={hintId} className="ds-hint" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

interface EntryListProps {
  entries: string[];
  onRemove?: (index: number) => void;
  /** Etykieta listy dla czytników. */
  label: string;
}

/** Wpisy z przyciskiem „Usuń <wpis>”; bez `onRemove` — sama lista (tryb tylko do odczytu). */
export function EntryList({ entries, onRemove, label }: EntryListProps) {
  if (entries.length === 0) return null;
  return (
    <ul aria-label={label} className="m-0 flex list-none flex-col gap-2 p-0">
      {entries.map((entry, i) => (
        <li
          key={`${i}-${entry}`}
          className="flex items-start justify-between gap-2 rounded-md border border-solid border-line bg-surface-muted px-3 py-2 text-body"
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">{entry}</span>
          {onRemove && (
            <button
              type="button"
              className="ds-btn ds-btn--link ds-btn--small shrink-0"
              onClick={() => onRemove(i)}
              aria-label={`Usuń: ${entry}`}
            >
              Usuń
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Pytania pomocnicze bloku w rozwijanym `details`. */
export function HelpQuestions({ help }: { help: string[] }) {
  if (help.length === 0) return null;
  return (
    <details className="text-body">
      <summary className="cursor-pointer font-bold text-navy">Pytania pomocnicze</summary>
      <ul className="mb-0 mt-2 flex flex-col gap-1 pl-6">
        {help.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
    </details>
  );
}

interface Props {
  block: CanvasBlock;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  readOnly?: boolean;
  /** Tytuł bloku tylko dla czytników (krok kanwy pokazuje go już w nagłówku `h2`). */
  titleHidden?: boolean;
}

function asList(value: BlockValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Blok `list`: wpisy dodawane polem „Dodaj”, każdy z „Usuń”. Pusta lista = `null` (usunięcie bloku). */
export function ListBlock({ block, value, onChange, readOnly = false, titleHidden = false }: Props) {
  const titleId = useId();
  const promptId = useId();
  const entries = asList(value);
  const listRef = useRef<HTMLDivElement>(null);

  function remove(index: number) {
    const next = entries.filter((_, i) => i !== index);
    onChange(next.length ? next : null);
    // Usunięty przycisk znika — fokus na pole dodawania, żeby nie zgubić miejsca.
    listRef.current?.querySelector("input")?.focus();
  }

  return (
    <div role="group" aria-labelledby={titleId} aria-describedby={promptId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span id={titleId} className={titleHidden ? "ds-sr-only" : "text-body-lg font-bold text-ink"}>
          {block.title}
        </span>
        <p id={promptId} className="ds-hint">
          {block.prompt}
        </p>
      </div>
      {readOnly ? (
        entries.length ? (
          <ul className="m-0 flex flex-col gap-1 pl-6 text-body">
            {entries.map((e, i) => (
              <li key={`${i}-${e}`} className="[overflow-wrap:anywhere]">
                {e}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-body text-ink-muted">Brak wpisów.</p>
        )
      ) : (
        <div ref={listRef} className="flex flex-col gap-3">
          <HelpQuestions help={block.help} />
          <EntryList entries={entries} onRemove={remove} label={`Wpisy: ${block.title}`} />
          <EntryAdder
            label="Nowy wpis"
            existing={entries}
            onAdd={(entry) => onChange([...entries, entry])}
            blockedReason={
              entries.length >= CANVAS_LIST_MAX_ITEMS ? `Lista ma już ${CANVAS_LIST_MAX_ITEMS} wpisów — usuń któryś, żeby dodać nowy.` : null
            }
          />
        </div>
      )}
    </div>
  );
}
