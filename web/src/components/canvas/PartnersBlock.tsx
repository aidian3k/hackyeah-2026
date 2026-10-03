import { useEffect, useId, useRef, useState } from "react";
import type { BlockValue, CanvasBlock, Partner } from "@/api/types";
import { CANVAS_ITEM_MAX_CHARS } from "@/components/canvas/ListBlock";
import { MarkerIcon, PartnerConstellation, statusShape } from "@/components/canvas/PartnerConstellation";

/** Lustro CANVAS_PARTNERS_MAX (api/config.py): maks. liczba partnerów. */
export const CANVAS_PARTNERS_MAX = 15;

interface Props {
  block: CanvasBlock;
  value: BlockValue | undefined;
  onChange: (value: BlockValue | null) => void;
  readOnly?: boolean;
}

function asPartners(value: BlockValue | undefined): Partner[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is Partner => typeof p === "object" && p !== null && "name" in p);
}

/** Partner gotowy do zapisu: ma nazwę i co najmniej jedną rolę (bez tego API zwraca 422). */
export function isPartnerComplete(p: Partner): boolean {
  return p.name.trim().length > 0 && p.roles.length > 0;
}

/** Tylko kompletni partnerzy — do autozapisu (K10), żeby niepełny wpis w trakcie edycji nie dawał 422. */
export function completePartners(list: Partner[]): Partner[] {
  return list.filter(isPartnerComplete);
}

function defaultStatus(block: CanvasBlock): string {
  return block.statuses.find((s) => s.code === "POTENTIAL")?.code ?? block.statuses[block.statuses.length - 1]?.code ?? "";
}

interface EditorProps {
  block: CanvasBlock;
  partner: Partner;
  number: number;
  onPatch: (patch: Partial<Partner>) => void;
  onRemove: () => void;
}

function PartnerEditor({ block, partner, number, onPatch, onRemove }: EditorProps) {
  const nameId = useId();
  const howId = useId();
  const statusId = useId();
  const warnId = useId();
  const incomplete = !isPartnerComplete(partner);
  const label = partner.name.trim() ? `Partner ${number}: ${partner.name.trim()}` : `Partner ${number}`;

  return (
    <fieldset
      className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-line p-4"
      aria-describedby={incomplete ? warnId : undefined}
    >
      <legend className="px-1 text-body-lg font-bold text-navy [overflow-wrap:anywhere]">{label}</legend>
      <div className="ds-field">
        <label htmlFor={nameId} className="ds-label">
          Nazwa partnera
        </label>
        <input
          id={nameId}
          type="text"
          className="ds-input"
          value={partner.name}
          maxLength={CANVAS_ITEM_MAX_CHARS}
          aria-required="true"
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </div>
      <div className="ds-field">
        <label htmlFor={howId} className="ds-label">
          Jak pomaga
        </label>
        <input
          id={howId}
          type="text"
          className="ds-input"
          value={partner.how}
          maxLength={CANVAS_ITEM_MAX_CHARS}
          onChange={(e) => onPatch({ how: e.target.value })}
        />
      </div>
      <fieldset className="ds-choices">
        <legend className="ds-choices__legend">W czym pomaga (zaznacz co najmniej jedno)</legend>
        {block.roles.map((r) => {
          const checked = partner.roles.includes(r.code);
          return (
            <label key={r.code} className="ds-choice text-body">
              <input
                type="checkbox"
                className="ds-choice__input"
                checked={checked}
                onChange={(e) =>
                  onPatch({
                    roles: block.roles
                      .map((x) => x.code)
                      .filter((c) => (c === r.code ? e.target.checked : partner.roles.includes(c))),
                  })
                }
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span>{r.label}</span>
                {r.description && <span className="text-small font-normal text-ink-muted">{r.description}</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="ds-field">
        <label htmlFor={statusId} className="ds-label">
          Status
        </label>
        <select
          id={statusId}
          className="ds-select"
          value={partner.status}
          onChange={(e) => onPatch({ status: e.target.value })}
        >
          {block.statuses.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {incomplete && (
        <p id={warnId} className="m-0 text-small text-ink">
          <strong>Uwaga:</strong> uzupełnij nazwę i zaznacz co najmniej jedną rolę — dopiero wtedy partner zostanie zapisany.
        </p>
      )}
      <div>
        <button type="button" className="ds-btn ds-btn--small" onClick={onRemove}>
          {`Usuń partnera ${number}`}
        </button>
      </div>
    </fieldset>
  );
}

/** Lista partnerów w trybie tylko do odczytu. */
function PartnerList({ block, partners }: { block: CanvasBlock; partners: Partner[] }) {
  const roleLabel = (code: string) => block.roles.find((r) => r.code === code)?.label ?? code;
  const statusLabel = (code: string) => block.statuses.find((s) => s.code === code)?.label ?? code;
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {partners.map((p, i) => (
        <li key={i} className="flex flex-col gap-1 rounded-md border border-solid border-line px-3 py-2 text-body">
          <span className="font-bold [overflow-wrap:anywhere]">{`${i + 1}. ${p.name}`}</span>
          {p.how && <span className="[overflow-wrap:anywhere]">{p.how}</span>}
          <span className="inline-flex items-center gap-2 text-small">
            <MarkerIcon shape={statusShape(p.status, block.statuses)} />
            {statusLabel(p.status)}
          </span>
          {p.roles.length > 0 && <span className="text-small text-ink-muted">{p.roles.map(roleLabel).join(" · ")}</span>}
        </li>
      ))}
    </ol>
  );
}

/**
 * Blok `partners`: konstelacja (3 koła ról) nad listą partnerów z nazwą, „Jak pomaga”, rolami i statusem.
 * `onChange` dostaje pełną listę, także niepełnych partnerów — do zapisu filtruj `completePartners()`.
 */
export function PartnersBlock({ block, value, onChange, readOnly = false }: Props) {
  const titleId = useId();
  const promptId = useId();
  const partners = asPartners(value);
  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusIndex === null) return;
    const sets = listRef.current?.querySelectorAll<HTMLFieldSetElement>(":scope > fieldset");
    sets?.[focusIndex]?.querySelector("input")?.focus();
    setFocusIndex(null);
  }, [focusIndex]);

  const heading = (
    <div className="flex flex-col gap-1">
      <span id={titleId} className="text-body-lg font-bold text-ink">
        {block.title}
      </span>
      <p id={promptId} className="ds-hint">
        {block.prompt}
      </p>
    </div>
  );

  if (readOnly) {
    return (
      <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
        {heading}
        <PartnerConstellation partners={partners} roles={block.roles} statuses={block.statuses} />
        {partners.length ? (
          <PartnerList block={block} partners={partners} />
        ) : (
          <p className="m-0 text-body text-ink-muted">Brak partnerów.</p>
        )}
      </div>
    );
  }

  function emit(next: Partner[]) {
    onChange(next.length ? next : null);
  }

  function add() {
    if (partners.length >= CANVAS_PARTNERS_MAX) return;
    emit([...partners, { name: "", how: "", roles: [], status: defaultStatus(block) }]);
    setFocusIndex(partners.length);
  }

  function remove(index: number) {
    emit(partners.filter((_, i) => i !== index));
    addRef.current?.focus();
  }

  const full = partners.length >= CANVAS_PARTNERS_MAX;
  return (
    <div role="group" aria-labelledby={titleId} aria-describedby={promptId} className="flex flex-col gap-4">
      {heading}
      <PartnerConstellation partners={partners} roles={block.roles} statuses={block.statuses} />
      <div ref={listRef} className="flex flex-col gap-4">
        {partners.map((p, i) => (
          <PartnerEditor
            key={i}
            block={block}
            partner={p}
            number={i + 1}
            onPatch={(patch) => emit(partners.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
            onRemove={() => remove(i)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <div>
          <button
            ref={addRef}
            type="button"
            className="ds-btn"
            onClick={add}
            aria-disabled={full ? true : undefined}
          >
            Dodaj partnera
          </button>
        </div>
        {full && <p className="ds-hint">{`Możesz dodać najwyżej ${CANVAS_PARTNERS_MAX} partnerów.`}</p>}
      </div>
    </div>
  );
}
