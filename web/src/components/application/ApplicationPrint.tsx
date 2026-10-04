import { Fragment, type ReactNode } from "react";
import type { BudgetPhase, BudgetRow, CallDetail, CallForm, CallSection, FormClause, FormField } from "@/api/types";
import { BUDGET_PHASE_LABELS, formatMoney } from "@/components/application/BudgetRows";
import { formatDateTime } from "@/lib/format";
import iws2Footer from "@/assets/iws2/logotypy-stopka.png";
import iws2Header from "@/assets/iws2/logotypy-naglowek.jpg";

/**
 * Wersja do druku wniosku (A4) — odtwarza wzór formularza naboru (`CallDetail.form`, feature-2026-10-04-5):
 * logotypy na każdej stronie, blok tytułowy, numerowane punkty z instrukcjami w nawiasach, dane pomysłodawcy
 * jako puste linie, tabele planu działania, oświadczenia i klauzule. Bez `form` — prosty układ pytań i odpowiedzi.
 *
 * Bez reguły `@page` (Tailwind jej nie generuje, a własny CSS jest zakazany): rozmiar i marginesy strony
 * ustawia okno drukowania; poziome wcięcie wzoru daje `px-12`.
 */

const LOGOS: Record<string, { header: string; headerAlt: string; footer: string; footerAlt: string }> = {
  iws2: {
    header: iws2Header,
    headerAlt: "Fundusze Europejskie dla Rozwoju Społecznego. Rzeczpospolita Polska. Dofinansowane przez Unię Europejską",
    footer: iws2Footer,
    footerAlt: "Małopolska. INNO AGH. ROPS Kraków — Instytucja Województwa Małopolskiego",
  },
};

const DEFAULT_BUDGET_HEADERS = ["Działanie", "Termin realizacji", "Koszt działania"];
/** Puste wiersze tabel jak we wzorze: 3 w okresie przygotowawczym, po 2 w każdej fazie testu. */
const MIN_ROWS: Record<BudgetPhase, number> = { prep: 3, test_1: 2, test_2: 2 };
const PHASE_ORDER: BudgetPhase[] = ["prep", "test_1", "test_2"];

export const PRINT_FOOTER = "Wydruk z Kreatora pomysłów (HubMI) — dokument roboczy, nie stanowi wniosku w naborze ROPS";

/** Numery punktów: `number` z naboru, a gdy nabór ich nie ma — kolejne 1…n. */
export function sectionNumbers(sections: CallSection[]): (string | null)[] {
  const numbered = sections.some((s) => s.number !== null && s.number !== undefined);
  return sections.map((s, i) => (numbered ? (s.number ?? null) : String(i + 1)));
}

interface Props {
  call: CallDetail;
  answers: Record<string, string>;
  rows: BudgetRow[];
  updatedAt: string;
}

/** Linie do wypełnienia odręcznego. */
function FillLines({ count = 3 }: { count?: number }) {
  return (
    <span aria-hidden="true" className="block">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="block h-8 border-0 border-b border-dotted border-ink-muted" />
      ))}
    </span>
  );
}

/** Etykieta pola z miejscem do wpisania po prawej (dane pomysłodawcy). */
function FillField({ marker, label, line = true }: { marker?: string; label: string; line?: boolean }) {
  return (
    <span className="flex gap-2">
      {marker && <span className="w-6 shrink-0">{marker}</span>}
      {/* Długa etykieta zawija się, a linia do wpisania przechodzi pod nią na pełną szerokość. */}
      <span className="flex min-w-0 flex-1 flex-wrap items-end gap-x-2">
        <span>{label}</span>
        {line && <span aria-hidden="true" className="mb-1 min-w-24 flex-1 border-0 border-b border-dotted border-ink-muted" />}
      </span>
    </span>
  );
}

function Answer({ text, lines = 3 }: { text: string | undefined; lines?: number }) {
  if (!text?.trim()) return <FillLines count={lines} />;
  return (
    <>
      {text
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => (
          <p key={i} className="m-0 mt-1 whitespace-pre-line [overflow-wrap:anywhere]">
            {para}
          </p>
        ))}
    </>
  );
}

/** Punkt numerowany wzoru: „N.” w wysunięciu, treść wcięta. */
function Numbered({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="mt-2 flex gap-3 pl-6">
      <span className="w-6 shrink-0 text-right">{number}.</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ApplicantVariants({ form }: { form: CallForm }) {
  return (
    <>
      {form.applicant_variants.map((v) => (
        <div key={v.title} className="mt-2">
          <p className="m-0 break-after-avoid">{v.title}</p>
          <ul className="m-0 list-none pl-12">
            {v.fields.map((f: FormField) => (
              <li key={f.marker + f.label} className="break-inside-avoid">
                <FillField marker={f.marker} label={f.label} line={f.sub.length === 0} />
                {f.sub.length > 0 && (
                  <ul className="m-0 list-[circle] pl-16">
                    {f.sub.map((sub) => (
                      <li key={sub} className="pl-2">
                        <FillField label={sub} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

const cell = "border border-solid border-ink px-2 py-1 align-top";

/** Tabela planu działania wzoru: 3 kolumny, wiersze-etykiety faz testu, puste wiersze do minimum wzoru. */
function BudgetTable({ headers, phases, rows }: { headers: string[]; phases: BudgetPhase[]; rows: BudgetRow[] }) {
  const labelled = phases.length > 1 || phases[0] !== "prep";
  return (
    <table className="mt-2 w-full table-fixed border-collapse">
      <thead className="table-row-group">
        <tr className="break-inside-avoid">
          {headers.map((h, i) => (
            <th key={i} scope="col" className={`${cell} w-1/3 text-left font-normal`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {phases.map((phase) => {
          const list = rows.filter((r) => r.phase === phase);
          const blanks = Math.max(MIN_ROWS[phase] - list.length, 0);
          return (
            <Fragment key={phase}>
              {labelled && (
                <tr className="break-inside-avoid break-after-avoid">
                  <th scope="rowgroup" className={`${cell} text-left font-normal`}>
                    {BUDGET_PHASE_LABELS[phase]}
                  </th>
                  <td className={cell} />
                  <td className={cell} />
                </tr>
              )}
              {list.map((r, i) => (
                <tr key={i} className="break-inside-avoid">
                  <td className={`${cell} [overflow-wrap:anywhere]`}>{r.action}</td>
                  <td className={`${cell} [overflow-wrap:anywhere]`}>{r.when}</td>
                  <td className={`${cell} whitespace-nowrap`}>{r.cost > 0 ? formatMoney(r.cost) : ""}</td>
                </tr>
              ))}
              {Array.from({ length: blanks }, (_, i) => (
                <tr key={`blank-${i}`} aria-hidden="true">
                  <td className={`${cell} h-8`} />
                  <td className={cell} />
                  <td className={cell} />
                </tr>
              ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function Clause({ clause }: { clause: FormClause }) {
  return (
    <section className={clause.new_page ? "break-before-page" : "mt-6"}>
      <p className="m-0 break-after-avoid font-bold">{clause.title}</p>
      {clause.blocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <p key={i} className="m-0 mt-4 flex break-after-avoid gap-3 pl-6 font-bold">
              <span className="w-12 shrink-0">{b.marker}</span>
              <span>{b.text}</span>
            </p>
          );
        }
        if (b.kind === "item") {
          return (
            <p key={i} className={`m-0 flex gap-2 ${b.level > 0 ? "pl-16" : "pl-6"}`}>
              <span className="w-6 shrink-0 text-right">{b.marker}</span>
              <span className="min-w-0 flex-1">{b.text}</span>
            </p>
          );
        }
        return (
          <p key={i} className="m-0 mt-2">
            {b.text}
          </p>
        );
      })}
      {clause.footnotes.length > 0 && (
        <div className="mt-6 break-inside-avoid">
          <span aria-hidden="true" className="block w-1/3 border-0 border-t border-solid border-ink" />
          {clause.footnotes.map((f) => (
            <p key={f} className="m-0 leading-normal">
              {f}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

export function ApplicationPrint({ call, answers, rows, updatedAt }: Props) {
  const form = call.form;
  const logos = form?.logos ? LOGOS[form.logos] : undefined;
  const numbers = sectionNumbers(call.sections);
  const total = rows.reduce((sum, r) => sum + r.cost, 0);
  const hasBudgetSection = call.sections.some((s) => s.kind === "budget");

  function heading(section: CallSection, number: string | null): ReactNode {
    const prompt = section.form_prompt ?? section.prompt;
    // Tabela planu działania stoi we wzorze bez własnego nagłówka (instrukcja jest w nagłówkach kolumn).
    if (section.kind === "budget") return null;
    if (number === null) {
      // Podpunkt (np. „Okres przygotowawczy”): nazwa pogrubiona, instrukcja w nawiasie w tym samym akapicie.
      return (
        <p className="m-0 mt-4 break-after-avoid">
          <strong>{section.title}</strong>
          {prompt && ` (${prompt})`}
        </p>
      );
    }
    if (section.form_inline) {
      return (
        <p className="m-0 break-after-avoid">
          {section.title}
          {prompt && <strong>{` (${prompt}):`}</strong>}
        </p>
      );
    }
    return (
      <>
        <p className="m-0 break-after-avoid font-bold">{section.title}</p>
        {prompt && <p className="m-0 break-after-avoid">({prompt})</p>}
      </>
    );
  }

  function body(section: CallSection): ReactNode {
    switch (section.kind) {
      case "text":
        return <Answer text={answers[section.id]} lines={section.max_chars !== null && section.max_chars <= 300 ? 1 : 3} />;
      case "budget":
        return (
          <BudgetTable
            headers={form?.budget_headers[section.id] ?? DEFAULT_BUDGET_HEADERS}
            phases={PHASE_ORDER.filter((p) => section.budget_phases.includes(p))}
            rows={rows}
          />
        );
      case "total":
        return total > 0 ? <p className="m-0 mt-1 font-bold">{formatMoney(total)}</p> : <FillLines count={1} />;
      default:
        if (section.id === "applicant" && form) return <ApplicantVariants form={form} />;
        if (section.id === "statements" && form) {
          return form.statement_sets.map((set) => (
            <div key={set.title} className="mt-2">
              <p className="m-0 break-after-avoid font-bold">{set.title}</p>
              <p className="m-0">{set.intro}</p>
              <ul className="m-0 list-[circle] pl-12">
                {set.items.map((item) => (
                  <li key={item} className="pl-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ));
        }
        if (section.id === "statements") {
          return (
            <ul className="m-0 list-[circle] pl-12">
              {call.statements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          );
        }
        return null;
    }
  }

  const content = (
    <div className="px-12">
      {/* Blok tytułowy wzoru */}
      {form ? (
        <>
          <p className="m-0 text-right">{form.annex_label}</p>
          <p className="m-0 mt-4 text-center">{form.title}</p>
          <p className="m-0 mt-4">{form.intro}</p>
        </>
      ) : (
        <p className="m-0 text-center font-bold">{call.title}</p>
      )}

      {call.sections.map((s, i) => {
        const number = numbers[i] ?? null;
        const block = (
          <>
            {heading(s, number)}
            {body(s)}
          </>
        );
        return number !== null ? (
          <Numbered key={s.id} number={number}>
            {block}
          </Numbered>
        ) : (
          <div key={s.id}>{block}</div>
        );
      })}

      {!hasBudgetSection && rows.length > 0 && (
        <div className="mt-4">
          <p className="m-0 break-after-avoid font-bold">Plan działania i koszty</p>
          <BudgetTable headers={DEFAULT_BUDGET_HEADERS} phases={["prep"]} rows={rows.map((r) => ({ ...r, phase: "prep" }))} />
          <p className="m-0 mt-2 font-bold">Razem: {formatMoney(total)}</p>
        </div>
      )}

      {form?.clauses.map((c) => <Clause key={c.title} clause={c} />)}

      <p className="m-0 mt-8 text-ink-muted">
        {PRINT_FOOTER}. Stan na {formatDateTime(updatedAt)}.
      </p>
    </div>
  );

  return (
    <div className="hidden font-sans text-small leading-loose text-ink print:block">
      {logos ? (
        <>
          {/* Logotypy: `fixed` powtarza je na każdej stronie, a odstępy w thead/tfoot rezerwują dla nich miejsce. */}
          <div className="fixed inset-x-0 top-0 px-12">
            <img src={logos.header} alt={logos.headerAlt} className="block h-auto w-full" />
          </div>
          <div className="fixed inset-x-0 bottom-0 px-12">
            <img src={logos.footer} alt={logos.footerAlt} className="block h-auto w-full" />
          </div>
          <table role="presentation" className="w-full border-collapse">
            <thead>
              <tr>
                <td className="p-0 px-12 pb-2">
                  <img src={logos.header} alt="" className="invisible block h-auto w-full" />
                </td>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <td className="p-0 px-12 pt-2">
                  <img src={logos.footer} alt="" className="invisible block h-auto w-full" />
                </td>
              </tr>
            </tfoot>
            <tbody>
              <tr>
                <td className="p-0">{content}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        content
      )}
    </div>
  );
}
