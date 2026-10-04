import { forwardRef, useId, useImperativeHandle, useState, type FormEvent } from "react";
import { api, type ApiError } from "@/api/client";
import type { IdeaCreate, IdeaDetail, IdeaStage, IdeaUpdate } from "@/api/types";
import { Alert } from "@/components/Alert";
import { GminaSelect } from "@/components/GminaSelect";
import { IDEA_FIELD_LABELS } from "@/components/assistant/AssistPanel";
import { toApiError } from "@/hooks/useApi";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { plural } from "@/lib/format";
import { IDEA_STAGES, IDEA_STAGE_DESCRIPTIONS, IDEA_STAGE_LABELS, PRIVACY_WARNING } from "@/lib/labels";
import { rememberIdea } from "@/lib/storage";

// Limity lustrzane do IdeaCreate w backendzie (api/kreator/schemas.py).
export const IDEA_LIMITS = {
  titleMin: 3,
  titleMax: 200,
  summaryMin: 10,
  summaryMax: 2000,
  essenceMax: 2000,
  audienceMax: 1000,
  authorMax: 100,
  emailMax: 320,
} as const;

// Jak _EMAIL_RE w api/schemas.py.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FieldKey = "title" | "summary" | "essence" | "audience" | "stage" | "category" | "gmina" | "author_name" | "contact_email";

// Kolejność pól w formularzu — pierwszy błąd w tej kolejności dostaje fokus.
const FIELD_ORDER: FieldKey[] = [
  "title",
  "summary",
  "essence",
  "audience",
  "stage",
  "category",
  "gmina",
  "author_name",
  "contact_email",
];

// Komunikaty, gdy backend odrzuci pole (422), a walidacja po stronie przeglądarki go nie złapała.
const SERVER_FIELD_MESSAGES: Record<FieldKey, string> = {
  title: `Tytuł musi mieć od ${IDEA_LIMITS.titleMin} do ${IDEA_LIMITS.titleMax} znaków.`,
  summary: `Opis musi mieć od ${IDEA_LIMITS.summaryMin} do ${IDEA_LIMITS.summaryMax} znaków.`,
  essence: `Istota pomysłu może mieć najwyżej ${IDEA_LIMITS.essenceMax} znaków.`,
  audience: `Pole „Dla kogo” może mieć najwyżej ${IDEA_LIMITS.audienceMax} znaków.`,
  stage: "Wybierz etap z listy.",
  category: "Wybierz wyzwanie z listy.",
  gmina: "Wybierz gminę z listy albo zostaw „Nie wybrano”.",
  author_name: `Podpis może mieć najwyżej ${IDEA_LIMITS.authorMax} znaków.`,
  contact_email: "Sprawdź adres e-mail, np. jan@example.pl.",
};

const ESSENCE_REQUIRED = "Opisz istotę pomysłu — bez tego nie wyślesz go do Hubu.";
const AUDIENCE_REQUIRED = "Napisz, dla kogo jest pomysł — bez tego nie wyślesz go do Hubu.";

export interface IdeaFormValues {
  title: string;
  summary: string;
  essence: string;
  audience: string;
  stage: IdeaStage;
  category: string;
  gmina: string | null;
  author_name: string;
  contact_email: string;
}

export const EMPTY_IDEA_VALUES: IdeaFormValues = {
  title: "",
  summary: "",
  essence: "",
  audience: "",
  stage: "IDEA",
  category: "",
  gmina: null,
  author_name: "",
  contact_email: "",
};

/** Wartości formularza z zapisanego pomysłu (e-mail nigdy nie wraca z API). */
export function valuesFromIdea(idea: IdeaDetail): IdeaFormValues {
  return {
    title: idea.title,
    summary: idea.summary,
    essence: idea.essence,
    audience: idea.audience,
    stage: idea.stage,
    category: idea.category ?? "",
    gmina: idea.gmina,
    author_name: idea.author_name ?? "",
    contact_email: "",
  };
}

/** Co zrobić po zapisie: zostać na fiszce, przejść na kanwę albo wysłać do Hubu. */
export type IdeaFormAction = "save" | "canvas" | "submit";

export interface IdeaSaveResult {
  idea: IdeaDetail;
  action: IdeaFormAction;
  /** Pomysł zapisany, ale wysłanie się nie udało (np. sieć) — tylko przy action="submit". */
  submitError?: ApiError;
}

/** Pola, które asystent może wstawić (AssistSuggestion.field przy target="idea"). */
const ASSIST_FIELDS = ["title", "summary", "essence", "audience"] as const;
type AssistField = (typeof ASSIST_FIELDS)[number];

export interface IdeaFormHandle {
  /** Wstawia propozycję asystenta do pola (bez zapisu). Zwraca false dla nieznanego pola. */
  applySuggestion(field: string, value: string): boolean;
}

type Errors = Partial<Record<FieldKey, string>>;

function validate(v: IdeaFormValues, forSubmit: boolean): Errors {
  const e: Errors = {};
  const title = v.title.trim();
  if (!title) e.title = "Wpisz tytuł pomysłu, np. „Sąsiedzka herbatka”.";
  else if (title.length < IDEA_LIMITS.titleMin) e.title = `Tytuł musi mieć co najmniej ${IDEA_LIMITS.titleMin} znaki.`;
  else if (title.length > IDEA_LIMITS.titleMax) e.title = `Tytuł może mieć najwyżej ${IDEA_LIMITS.titleMax} znaków.`;

  const summary = v.summary.trim();
  if (!summary) e.summary = "Opisz pomysł w 2–3 zdaniach.";
  else if (summary.length < IDEA_LIMITS.summaryMin) e.summary = `Opis musi mieć co najmniej ${IDEA_LIMITS.summaryMin} znaków.`;
  else if (summary.length > IDEA_LIMITS.summaryMax) e.summary = `Opis może mieć najwyżej ${IDEA_LIMITS.summaryMax} znaków.`;

  const essence = v.essence.trim();
  if (essence.length > IDEA_LIMITS.essenceMax) e.essence = SERVER_FIELD_MESSAGES.essence;
  else if (forSubmit && !essence) e.essence = ESSENCE_REQUIRED;

  const audience = v.audience.trim();
  if (audience.length > IDEA_LIMITS.audienceMax) e.audience = SERVER_FIELD_MESSAGES.audience;
  else if (forSubmit && !audience) e.audience = AUDIENCE_REQUIRED;

  if (v.author_name.trim().length > IDEA_LIMITS.authorMax) e.author_name = SERVER_FIELD_MESSAGES.author_name;

  const email = v.contact_email.trim();
  if (email && (email.length > IDEA_LIMITS.emailMax || !EMAIL_RE.test(email)))
    e.contact_email = SERVER_FIELD_MESSAGES.contact_email;
  return e;
}

/** Pola wspólne dla POST i PATCH. Pusty e-mail nie jest wysyłany (nie kasuje zapisanego). */
function toUpdate(v: IdeaFormValues): IdeaUpdate {
  const payload: IdeaUpdate = {
    title: v.title.trim(),
    summary: v.summary.trim(),
    essence: v.essence.trim(),
    audience: v.audience.trim(),
    stage: v.stage,
    category: v.category || null,
    gmina: v.gmina,
    author_name: v.author_name.trim() || null,
  };
  const email = v.contact_email.trim();
  if (email) payload.contact_email = email;
  return payload;
}

/** 422 VALIDATION_ERROR ma komunikat „pole: opis”; IDEA_INCOMPLETE wymienia brakujące pola słownie. */
function errorsFromServer(err: ApiError): Errors | null {
  if (err.status !== 422) return null;
  if (err.code === "IDEA_INCOMPLETE") {
    const msg = err.message.toLocaleLowerCase("pl");
    const e: Errors = {};
    if (msg.includes("istota")) e.essence = ESSENCE_REQUIRED;
    if (msg.includes("dla kogo")) e.audience = AUDIENCE_REQUIRED;
    return Object.keys(e).length ? e : null;
  }
  const prefix = err.message.split(":", 1)[0]?.split(".", 1)[0]?.trim() ?? "";
  return (FIELD_ORDER as string[]).includes(prefix) ? { [prefix]: SERVER_FIELD_MESSAGES[prefix as FieldKey] } : null;
}

function firstError(errors: Errors): FieldKey | null {
  return FIELD_ORDER.find((k) => errors[k]) ?? null;
}

interface Props {
  initial: IdeaFormValues;
  /** Zapisany pomysł (edycja przez PATCH) albo null (nowy, POST). */
  idea: IdeaDetail | null;
  /** Numer zgłoszenia, z którego powstaje nowy pomysł (tylko przy POST). */
  sourceReportId?: number | null;
  onSaved(result: IdeaSaveResult): void;
}

const LEGEND = "mb-4 p-0 font-sans text-h2 text-navy";
const GROUP = "m-0 flex min-w-0 flex-col gap-6 border-0 p-0";

/** Fiszka pomysłu (Moduł 3): zapis na /api/ideas, przejście na kanwę i wysłanie do Hubu. */
export const IdeaForm = forwardRef<IdeaFormHandle, Props>(function IdeaForm(
  { initial, idea, sourceReportId = null, onSaved },
  ref,
) {
  const uid = useId();
  const ids = Object.fromEntries(FIELD_ORDER.map((k) => [k, `${uid}-${k}`])) as Record<FieldKey, string>;
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const categories = taxonomy.filter((t) => t.code !== "OTHER");

  const [values, setValues] = useState<IdeaFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState<IdeaFormAction | null>(null);
  const [status, setStatus] = useState("");

  const isDraft = idea === null || idea.status === "DRAFT";

  function set<K extends keyof IdeaFormValues>(key: K, value: IdeaFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function focusField(key: FieldKey) {
    // Po renderze komunikatów błędu, żeby czytnik od razu przeczytał opis pola.
    requestAnimationFrame(() => {
      const el = document.getElementById(ids[key]);
      // Etap to grupa radio — fokus na zaznaczonej opcji.
      const target = el?.matches("input, textarea, select") ? el : el?.querySelector<HTMLElement>("input:checked, input");
      target?.focus();
    });
  }

  useImperativeHandle(ref, () => ({
    applySuggestion(field: string, value: string) {
      if (!(ASSIST_FIELDS as readonly string[]).includes(field)) return false;
      const key = field as AssistField;
      set(key, value);
      setErrors((e) => ({ ...e, [key]: undefined }));
      setStatus(`Wstawiono propozycję do pola „${IDEA_FIELD_LABELS[key]}”. Zapisz zmiany, żeby ją zachować.`);
      focusField(key);
      return true;
    },
  }));

  function showErrors(next: Errors) {
    setErrors(next);
    const first = firstError(next);
    const n = Object.keys(next).length;
    setStatus(`Popraw ${n} ${plural(n, "pole", "pola", "pól")} w formularzu.`);
    if (first) focusField(first);
  }

  async function save(action: IdeaFormAction) {
    if (busy) return;
    setSubmitError(null);
    const found = validate(values, action === "submit");
    if (firstError(found)) {
      showErrors(found);
      return;
    }
    setErrors({});
    setBusy(action);
    setStatus(action === "submit" ? "Wysyłanie pomysłu…" : "Zapisywanie pomysłu…");

    let saved: IdeaDetail;
    try {
      if (idea) {
        saved = await api.updateIdea(idea.id, toUpdate(values));
      } else {
        const body: IdeaCreate = { ...(toUpdate(values) as IdeaCreate) };
        if (sourceReportId !== null) body.source_report_id = sourceReportId;
        saved = await api.createIdea(body);
      }
      rememberIdea(saved);
    } catch (err: unknown) {
      handleError(toApiError(err));
      setBusy(null);
      return;
    }

    if (action !== "submit") {
      setBusy(null);
      setStatus(action === "save" ? "Zapisano." : "");
      onSaved({ idea: saved, action });
      return;
    }

    try {
      const submitted = await api.submitIdea(saved.id);
      setStatus("");
      onSaved({ idea: submitted, action });
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      if (idea) {
        // Edycja: zostajemy na fiszce, błąd przy polu albo pod przyciskami.
        onSaved({ idea: saved, action: "save" });
        handleError(apiErr);
      } else {
        // Nowy pomysł już istnieje — rodzic przenosi na jego fiszkę i pokazuje błąd wysłania.
        onSaved({ idea: saved, action, submitError: apiErr });
      }
    } finally {
      setBusy(null);
    }
  }

  function handleError(apiErr: ApiError) {
    const fieldErrors = errorsFromServer(apiErr);
    if (fieldErrors) {
      showErrors(fieldErrors);
    } else {
      setStatus("");
      setSubmitError(apiErr);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Enter w polu = zapis bez zmiany ekranu (wysłanie do Hubu tylko przyciskiem).
    void save("save");
  }

  /** aria-describedby z istniejących elementów pomocy, licznika i błędu. */
  function describedBy(key: FieldKey, extra: string[] = []): string | undefined {
    const parts = [...extra, errors[key] ? `${ids[key]}-error` : ""].filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  }

  function fieldError(key: FieldKey) {
    return errors[key] ? (
      <p className="ds-error" id={`${ids[key]}-error`}>
        {errors[key]}
      </p>
    ) : null;
  }

  function counter(key: "summary" | "essence" | "audience", max: number) {
    const len = values[key].trim().length;
    return (
      <p className="ds-counter" id={`${ids[key]}-counter`} data-state={len >= max * 0.9 ? "limit" : undefined}>
        {len} z {max} znaków
      </p>
    );
  }

  const stageName = `${uid}-stage`;
  const busyAttr = (a: IdeaFormAction) => (busy === a ? true : undefined);

  return (
    <form className="flex flex-col gap-8" noValidate onSubmit={handleSubmit}>
      <fieldset className={GROUP}>
        <legend className={LEGEND}>Na czym polega pomysł</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.title}>
            Tytuł pomysłu
          </label>
          <input
            id={ids.title}
            className="ds-input"
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={IDEA_LIMITS.titleMax}
            autoComplete="off"
            required
            aria-required="true"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy("title")}
          />
          {fieldError("title")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.summary}>
            Krótki opis
          </label>
          <p className="ds-hint" id={`${ids.summary}-hint`}>
            Opisz pomysł w 2–3 zdaniach: jaki problem rozwiązuje i co się dzięki niemu zmienia.
          </p>
          <textarea
            id={ids.summary}
            className="ds-textarea"
            rows={4}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            maxLength={IDEA_LIMITS.summaryMax}
            required
            aria-required="true"
            aria-invalid={errors.summary ? true : undefined}
            aria-describedby={describedBy("summary", [`${ids.summary}-hint`, `${ids.summary}-counter`])}
          />
          {counter("summary", IDEA_LIMITS.summaryMax)}
          {fieldError("summary")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.essence}>
            Na czym polega istota pomysłu?
          </label>
          <p className="ds-hint" id={`${ids.essence}-hint`}>
            Co jest w nim najważniejsze i czym różni się od tego, co już jest. Wymagane do wysłania.
          </p>
          <textarea
            id={ids.essence}
            className="ds-textarea"
            rows={4}
            value={values.essence}
            onChange={(e) => set("essence", e.target.value)}
            maxLength={IDEA_LIMITS.essenceMax}
            aria-invalid={errors.essence ? true : undefined}
            aria-describedby={describedBy("essence", [`${ids.essence}-hint`, `${ids.essence}-counter`])}
          />
          {counter("essence", IDEA_LIMITS.essenceMax)}
          {fieldError("essence")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.audience}>
            Dla kogo jest pomysł?
          </label>
          <p className="ds-hint" id={`${ids.audience}-hint`}>
            Np. seniorzy mieszkający samotnie, młodzież ze szkół średnich. Wymagane do wysłania.
          </p>
          <textarea
            id={ids.audience}
            className="ds-textarea"
            rows={3}
            value={values.audience}
            onChange={(e) => set("audience", e.target.value)}
            maxLength={IDEA_LIMITS.audienceMax}
            aria-invalid={errors.audience ? true : undefined}
            aria-describedby={describedBy("audience", [`${ids.audience}-hint`, `${ids.audience}-counter`])}
          />
          {counter("audience", IDEA_LIMITS.audienceMax)}
          {fieldError("audience")}
        </div>

        <fieldset className="ds-choices" id={ids.stage} aria-describedby={describedBy("stage")}>
          <legend className="ds-choices__legend">Etap</legend>
          {IDEA_STAGES.map((stage) => (
            <label key={stage} className="ds-choice">
              <input
                className="ds-choice__input"
                type="radio"
                name={stageName}
                value={stage}
                checked={values.stage === stage}
                onChange={() => set("stage", stage)}
                aria-describedby={`${stageName}-${stage}-desc`}
              />
              <span className="flex flex-col">
                {IDEA_STAGE_LABELS[stage]}
                <span id={`${stageName}-${stage}-desc`} className="text-small text-ink-muted">
                  {IDEA_STAGE_DESCRIPTIONS[stage]}
                </span>
              </span>
            </label>
          ))}
          {fieldError("stage")}
        </fieldset>
      </fieldset>

      <fieldset className={GROUP}>
        <legend className={LEGEND}>Gdzie i jakie wyzwanie</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.category}>
            Wyzwanie (opcjonalnie)
          </label>
          <select
            id={ids.category}
            className="ds-select"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={describedBy("category", taxonomyError ? [`${ids.category}-load-error`] : [])}
          >
            <option value="">Nie wybrano</option>
            {categories.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
          </select>
          {taxonomyError && (
            <p className="ds-error" id={`${ids.category}-load-error`}>
              Nie udało się wczytać listy wyzwań. Możesz pominąć to pole.
            </p>
          )}
          {fieldError("category")}
        </div>

        <GminaSelect
          id={ids.gmina}
          label="Gmina (opcjonalnie)"
          hint="Gdzie pomysł działa albo ma działać."
          value={values.gmina}
          onChange={(g) => set("gmina", g)}
          error={errors.gmina}
        />
      </fieldset>

      <fieldset className={GROUP}>
        <legend className={LEGEND}>Kontakt (opcjonalnie)</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.author_name}>
            Podpis (opcjonalnie)
          </label>
          <p className="ds-hint" id={`${ids.author_name}-hint`}>
            Imię lub nazwa organizacji.
          </p>
          <input
            id={ids.author_name}
            className="ds-input"
            type="text"
            value={values.author_name}
            onChange={(e) => set("author_name", e.target.value)}
            maxLength={IDEA_LIMITS.authorMax}
            autoComplete="off"
            aria-invalid={errors.author_name ? true : undefined}
            aria-describedby={describedBy("author_name", [`${ids.author_name}-hint`])}
          />
          {fieldError("author_name")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.contact_email}>
            E-mail (opcjonalnie)
          </label>
          <p className="ds-hint" id={`${ids.contact_email}-hint`}>
            {idea?.has_contact
              ? "Twój e-mail jest już zapisany. Wpisz nowy tylko wtedy, gdy chcesz go zmienić."
              : "Tylko do kontaktu z zespołem Hubu. Nie pokazujemy go nikomu."}
          </p>
          <input
            id={ids.contact_email}
            className="ds-input"
            type="email"
            inputMode="email"
            value={values.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            maxLength={IDEA_LIMITS.emailMax}
            autoComplete="email"
            aria-invalid={errors.contact_email ? true : undefined}
            aria-describedby={describedBy("contact_email", [`${ids.contact_email}-hint`])}
          />
          {fieldError("contact_email")}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4">
        <Alert tone="warning">{PRIVACY_WARNING}</Alert>
        <div role="alert" className="empty:hidden">
          {submitError &&
            (submitError.status === 503 || submitError.status === 0 ? (
              <Alert tone="danger">Nie udało się teraz zapisać pomysłu. Spróbuj ponownie za chwilę.</Alert>
            ) : (
              <Alert tone="danger">{submitError.message}</Alert>
            ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {isDraft ? (
            <button type="submit" className="ds-btn" aria-disabled={busyAttr("save")} aria-busy={busyAttr("save")}>
              {busy === "save" ? "Zapisywanie…" : "Zapisz szkic"}
            </button>
          ) : (
            <button
              type="submit"
              className="ds-btn ds-btn--primary"
              aria-disabled={busyAttr("save")}
              aria-busy={busyAttr("save")}
            >
              {busy === "save" ? "Zapisywanie…" : "Zapisz zmiany"}
            </button>
          )}
          <button
            type="button"
            className="ds-btn"
            onClick={() => void save("canvas")}
            aria-disabled={busyAttr("canvas")}
            aria-busy={busyAttr("canvas")}
          >
            {busy === "canvas" ? "Zapisywanie…" : "Zapisz i rozwiń na kanwie"}
          </button>
          {isDraft && (
            <button
              type="button"
              className="ds-btn ds-btn--cta aria-disabled:cursor-progress"
              onClick={() => void save("submit")}
              aria-disabled={busyAttr("submit")}
              aria-busy={busyAttr("submit")}
            >
              {busy === "submit" ? "Wysyłanie…" : "Wyślij do Hubu"}
            </button>
          )}
        </div>
        <p className="ds-sr-only" aria-live="polite">
          {status}
        </p>
      </div>
    </form>
  );
});
