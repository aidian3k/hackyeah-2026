import { useId, useState, type FormEvent } from "react";
import { api, type ApiError } from "@/api/client";
import type { SolutionSubmit } from "@/api/types";
import { Alert } from "@/components/Alert";
import { GminaSelect } from "@/components/GminaSelect";
import { toApiError } from "@/hooks/useApi";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { plural } from "@/lib/format";
import { PRIVACY_WARNING } from "@/lib/labels";

// Limity lustrzane do SolutionSubmit w backendzie (api/schemas.py).
const LIMITS = {
  titleMin: 3,
  titleMax: 200,
  summaryMin: 10,
  summaryMax: 2000,
  bodyMax: 20_000,
  organizationMax: 300,
  targetGroupMax: 300,
  costRangeMax: 100,
  sourceUrlMax: 2000,
  signatureMax: 200,
  tagsMax: 20,
  stepsMax: 30,
} as const;

const STAGES = ["Pomysł", "Przygotowania", "Testujemy w małej skali", "Działa na stałe"] as const;

type FieldKey =
  | "title"
  | "summary"
  | "body"
  | "category"
  | "target_group"
  | "gmina"
  | "organization"
  | "implementation_steps"
  | "cost_range"
  | "source_url"
  | "tags"
  | "submitted_by_name";

// Kolejność pól w formularzu — pierwszy błąd w tej kolejności dostaje fokus.
const FIELD_ORDER: FieldKey[] = [
  "title",
  "summary",
  "body",
  "category",
  "target_group",
  "gmina",
  "organization",
  "implementation_steps",
  "cost_range",
  "source_url",
  "tags",
  "submitted_by_name",
];

// Komunikaty, gdy backend odrzuci pole (422), a walidacja po stronie przeglądarki go nie złapała.
const SERVER_FIELD_MESSAGES: Record<FieldKey, string> = {
  title: `Nazwa musi mieć od ${LIMITS.titleMin} do ${LIMITS.titleMax} znaków.`,
  summary: `Opis musi mieć od ${LIMITS.summaryMin} do ${LIMITS.summaryMax} znaków.`,
  body: "Skróć szczegóły — mogą mieć najwyżej 20 000 znaków.",
  category: "Wybierz wyzwanie z listy.",
  target_group: `Pole „Dla kogo” może mieć najwyżej ${LIMITS.targetGroupMax} znaków.`,
  gmina: "Wybierz gminę z listy albo zostaw „Nie wybrano”.",
  organization: `Nazwa organizacji może mieć najwyżej ${LIMITS.organizationMax} znaków.`,
  implementation_steps: `Wpisz najwyżej ${LIMITS.stepsMax} kroków.`,
  cost_range: `Koszt może mieć najwyżej ${LIMITS.costRangeMax} znaków.`,
  source_url: "Sprawdź adres strony lub filmu.",
  tags: `Wpisz najwyżej ${LIMITS.tagsMax} słów kluczowych.`,
  submitted_by_name: `Podpis może mieć najwyżej ${LIMITS.signatureMax} znaków.`,
};

interface Values {
  title: string;
  summary: string;
  stage: string;
  body: string;
  category: string;
  target_group: string;
  gmina: string | null;
  organization: string;
  steps: string;
  cost_range: string;
  source_url: string;
  tags: string;
  submitted_by_name: string;
}

const EMPTY: Values = {
  title: "",
  summary: "",
  stage: "",
  body: "",
  category: "",
  target_group: "",
  gmina: null,
  organization: "",
  steps: "",
  cost_range: "",
  source_url: "",
  tags: "",
  submitted_by_name: "",
};

type Errors = Partial<Record<FieldKey, string>>;

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(",")) {
    const tag = raw.trim();
    const key = tag.toLocaleLowerCase("pl");
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function isHttpUrl(text: string): boolean {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Treść body wysyłana do API: etap realizacji jako pierwsza linia (backend nie ma osobnego pola). */
function composeBody(v: Values): string {
  const details = v.body.trim();
  if (!v.stage) return details;
  const head = `Etap realizacji: ${v.stage}`;
  return details ? `${head}\n\n${details}` : head;
}

const orNull = (s: string) => s.trim() || null;

/** Buduje SolutionSubmit wyłącznie z pól typu (extra="forbid" w backendzie). */
function toPayload(v: Values): SolutionSubmit {
  const payload: SolutionSubmit = {
    title: v.title.trim(),
    summary: v.summary.trim(),
  };
  const body = composeBody(v);
  if (body) payload.body = body;
  const organization = orNull(v.organization);
  if (organization) payload.organization = organization;
  if (v.gmina) payload.gmina = v.gmina;
  if (v.category) payload.category = v.category;
  const tags = splitTags(v.tags);
  if (tags.length) payload.tags = tags;
  const targetGroup = orNull(v.target_group);
  if (targetGroup) payload.target_group = targetGroup;
  const cost = orNull(v.cost_range);
  if (cost) payload.cost_range = cost;
  const steps = splitLines(v.steps);
  if (steps.length) payload.implementation_steps = steps;
  const url = orNull(v.source_url);
  if (url) payload.source_url = url;
  const name = orNull(v.submitted_by_name);
  if (name) payload.submitted_by_name = name;
  return payload;
}

function tooLong(text: string, max: number): boolean {
  return text.trim().length > max;
}

function validate(v: Values): Errors {
  const e: Errors = {};
  const title = v.title.trim();
  if (!title) e.title = "Wpisz nazwę pomysłu, np. „Sąsiedzka herbatka”.";
  else if (title.length < LIMITS.titleMin) e.title = `Nazwa musi mieć co najmniej ${LIMITS.titleMin} znaki.`;
  else if (title.length > LIMITS.titleMax) e.title = `Nazwa może mieć najwyżej ${LIMITS.titleMax} znaków.`;

  const summary = v.summary.trim();
  if (!summary) e.summary = "Opisz pomysł w 2–3 zdaniach.";
  else if (summary.length < LIMITS.summaryMin) e.summary = `Opis musi mieć co najmniej ${LIMITS.summaryMin} znaków.`;
  else if (summary.length > LIMITS.summaryMax) e.summary = `Opis może mieć najwyżej ${LIMITS.summaryMax} znaków.`;

  if (composeBody(v).length > LIMITS.bodyMax) e.body = SERVER_FIELD_MESSAGES.body;
  if (tooLong(v.target_group, LIMITS.targetGroupMax)) e.target_group = SERVER_FIELD_MESSAGES.target_group;
  if (tooLong(v.organization, LIMITS.organizationMax)) e.organization = SERVER_FIELD_MESSAGES.organization;

  const steps = splitLines(v.steps);
  if (steps.length > LIMITS.stepsMax)
    e.implementation_steps = `Wpisz najwyżej ${LIMITS.stepsMax} kroków. Teraz jest ich ${steps.length}.`;

  if (tooLong(v.cost_range, LIMITS.costRangeMax)) e.cost_range = SERVER_FIELD_MESSAGES.cost_range;

  const url = v.source_url.trim();
  if (url && !isHttpUrl(url)) e.source_url = "Wpisz pełny adres zaczynający się od https://, np. https://www.youtube.com/watch?v=…";
  else if (url.length > LIMITS.sourceUrlMax) e.source_url = `Adres może mieć najwyżej ${LIMITS.sourceUrlMax} znaków.`;

  const tags = splitTags(v.tags);
  if (tags.length > LIMITS.tagsMax)
    e.tags = `Wpisz najwyżej ${LIMITS.tagsMax} słów kluczowych. Teraz jest ich ${tags.length}.`;

  if (tooLong(v.submitted_by_name, LIMITS.signatureMax)) e.submitted_by_name = SERVER_FIELD_MESSAGES.submitted_by_name;
  return e;
}

/** 422 z backendu ma komunikat „pole: opis” (np. „gmina: nieznana gmina …”) — mapujemy po prefiksie. */
function fieldFromServerMessage(message: string): FieldKey | null {
  const prefix = message.split(":", 1)[0]?.split(".", 1)[0]?.trim() ?? "";
  if (prefix === "media") return "source_url";
  return (FIELD_ORDER as string[]).includes(prefix) ? (prefix as FieldKey) : null;
}

function firstError(errors: Errors): FieldKey | null {
  return FIELD_ORDER.find((k) => errors[k]) ?? null;
}

interface Props {
  onCreated(id: number): void;
}

/** Fiszka pomysłu (base.md III): trafia do kolejki Hubu jako PENDING_REVIEW. */
export function IdeaForm({ onCreated }: Props) {
  const uid = useId();
  const ids = Object.fromEntries(FIELD_ORDER.map((k) => [k, `${uid}-${k}`])) as Record<FieldKey, string>;
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const categories = taxonomy.filter((t) => t.code !== "OTHER");

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function focusField(key: FieldKey) {
    // Po renderze komunikatów błędu, żeby czytnik od razu przeczytał opis pola.
    requestAnimationFrame(() => document.getElementById(ids[key])?.focus());
  }

  function showErrors(next: Errors) {
    setErrors(next);
    const first = firstError(next);
    const n = Object.keys(next).length;
    setStatus(`Popraw ${n} ${plural(n, "pole", "pola", "pól")} w formularzu.`);
    if (first) focusField(first);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSubmitError(null);
    const found = validate(values);
    if (firstError(found)) {
      showErrors(found);
      return;
    }
    setErrors({});
    setSending(true);
    setStatus("Wysyłanie pomysłu…");
    try {
      const created = await api.submitSolution(toPayload(values));
      setStatus("");
      onCreated(created.id);
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      const field = apiErr.status === 422 ? fieldFromServerMessage(apiErr.message) : null;
      if (field) {
        showErrors({ [field]: SERVER_FIELD_MESSAGES[field] });
      } else {
        setStatus("");
        setSubmitError(apiErr);
      }
    } finally {
      setSending(false);
    }
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

  const summaryLen = values.summary.trim().length;
  const summaryAtLimit = summaryLen >= LIMITS.summaryMax * 0.9;
  const stageName = `${uid}-stage`;

  return (
    <form className="idea-form" noValidate onSubmit={handleSubmit}>
      <fieldset className="idea-group">
        <legend className="idea-group__legend">Na czym polega pomysł</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.title}>
            Nazwa pomysłu
          </label>
          <input
            id={ids.title}
            className="ds-input"
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={LIMITS.titleMax}
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
            Opisz w 2–3 zdaniach
          </label>
          <p className="ds-hint" id={`${ids.summary}-hint`}>
            Napisz, komu pomaga pomysł i co się dzięki niemu zmienia.
          </p>
          <textarea
            id={ids.summary}
            className="ds-textarea"
            rows={4}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            maxLength={LIMITS.summaryMax}
            required
            aria-required="true"
            aria-invalid={errors.summary ? true : undefined}
            aria-describedby={describedBy("summary", [`${ids.summary}-hint`, `${ids.summary}-counter`])}
          />
          <p className="ds-counter" id={`${ids.summary}-counter`} data-state={summaryAtLimit ? "limit" : undefined}>
            {summaryLen} z {LIMITS.summaryMax} znaków
          </p>
          {fieldError("summary")}
        </div>

        <fieldset className="ds-choices">
          <legend className="ds-choices__legend">Etap realizacji (opcjonalnie)</legend>
          {STAGES.map((stage) => (
            <label key={stage} className="ds-choice">
              <input
                className="ds-choice__input"
                type="radio"
                name={stageName}
                value={stage}
                checked={values.stage === stage}
                onChange={() => set("stage", stage)}
              />
              {stage}
            </label>
          ))}
          {values.stage && (
            <div>
              <button type="button" className="ds-btn ds-btn--link" onClick={() => set("stage", "")}>
                Wyczyść wybór etapu
              </button>
            </div>
          )}
        </fieldset>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.body}>
            Więcej szczegółów (opcjonalnie)
          </label>
          <textarea
            id={ids.body}
            className="ds-textarea"
            rows={6}
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={describedBy("body")}
          />
          {fieldError("body")}
        </div>
      </fieldset>

      <fieldset className="idea-group">
        <legend className="idea-group__legend">Dla kogo i gdzie</legend>

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

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.target_group}>
            Dla kogo (opcjonalnie)
          </label>
          <p className="ds-hint" id={`${ids.target_group}-hint`}>
            Np. seniorzy mieszkający samotnie, młodzież ze szkół średnich.
          </p>
          <input
            id={ids.target_group}
            className="ds-input"
            type="text"
            value={values.target_group}
            onChange={(e) => set("target_group", e.target.value)}
            maxLength={LIMITS.targetGroupMax}
            aria-invalid={errors.target_group ? true : undefined}
            aria-describedby={describedBy("target_group", [`${ids.target_group}-hint`])}
          />
          {fieldError("target_group")}
        </div>

        <GminaSelect
          id={ids.gmina}
          label="Gmina (opcjonalnie)"
          hint="Gdzie pomysł działa albo ma działać."
          value={values.gmina}
          onChange={(g) => set("gmina", g)}
          error={errors.gmina}
        />

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.organization}>
            Organizacja (opcjonalnie)
          </label>
          <input
            id={ids.organization}
            className="ds-input"
            type="text"
            value={values.organization}
            onChange={(e) => set("organization", e.target.value)}
            maxLength={LIMITS.organizationMax}
            autoComplete="organization"
            aria-invalid={errors.organization ? true : undefined}
            aria-describedby={describedBy("organization")}
          />
          {fieldError("organization")}
        </div>
      </fieldset>

      <fieldset className="idea-group">
        <legend className="idea-group__legend">Jak to zrobić (opcjonalnie)</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.implementation_steps}>
            Kolejne kroki, każdy w nowej linii
          </label>
          <p className="ds-hint" id={`${ids.implementation_steps}-hint`}>
            Najwyżej {LIMITS.stepsMax} kroków. Puste linie pomijamy.
          </p>
          <textarea
            id={ids.implementation_steps}
            className="ds-textarea"
            rows={5}
            value={values.steps}
            onChange={(e) => set("steps", e.target.value)}
            aria-invalid={errors.implementation_steps ? true : undefined}
            aria-describedby={describedBy("implementation_steps", [`${ids.implementation_steps}-hint`])}
          />
          {fieldError("implementation_steps")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.cost_range}>
            Szacowany koszt
          </label>
          <p className="ds-hint" id={`${ids.cost_range}-hint`}>
            Np. do 10 tys. zł.
          </p>
          <input
            id={ids.cost_range}
            className="ds-input"
            type="text"
            value={values.cost_range}
            onChange={(e) => set("cost_range", e.target.value)}
            maxLength={LIMITS.costRangeMax}
            aria-invalid={errors.cost_range ? true : undefined}
            aria-describedby={describedBy("cost_range", [`${ids.cost_range}-hint`])}
          />
          {fieldError("cost_range")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.source_url}>
            Link do strony lub filmu
          </label>
          <p className="ds-hint" id={`${ids.source_url}-hint`}>
            Pełny adres, np. https://www.youtube.com/watch?v=…
          </p>
          <input
            id={ids.source_url}
            className="ds-input"
            type="url"
            inputMode="url"
            value={values.source_url}
            onChange={(e) => set("source_url", e.target.value)}
            maxLength={LIMITS.sourceUrlMax}
            autoComplete="url"
            aria-invalid={errors.source_url ? true : undefined}
            aria-describedby={describedBy("source_url", [`${ids.source_url}-hint`])}
          />
          {fieldError("source_url")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={ids.tags}>
            Słowa kluczowe
          </label>
          <p className="ds-hint" id={`${ids.tags}-hint`}>
            Rozdziel przecinkiem, np. seniorzy, wolontariat, sąsiedzi.
          </p>
          <input
            id={ids.tags}
            className="ds-input"
            type="text"
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
            aria-invalid={errors.tags ? true : undefined}
            aria-describedby={describedBy("tags", [`${ids.tags}-hint`])}
          />
          {fieldError("tags")}
        </div>
      </fieldset>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.submitted_by_name}>
          Podpis (opcjonalnie)
        </label>
        <p className="ds-hint" id={`${ids.submitted_by_name}-hint`}>
          Imię lub nazwa organizacji.
        </p>
        <input
          id={ids.submitted_by_name}
          className="ds-input"
          type="text"
          value={values.submitted_by_name}
          onChange={(e) => set("submitted_by_name", e.target.value)}
          maxLength={LIMITS.signatureMax}
          autoComplete="off"
          aria-invalid={errors.submitted_by_name ? true : undefined}
          aria-describedby={describedBy("submitted_by_name", [`${ids.submitted_by_name}-hint`])}
        />
        {fieldError("submitted_by_name")}
      </div>

      <div className="idea-form__submit">
        <Alert tone="warning">{PRIVACY_WARNING}</Alert>
        <div role="alert">
          {submitError &&
            (submitError.status === 503 ? (
              <Alert tone="danger">Nie udało się teraz zapisać pomysłu. Spróbuj ponownie za chwilę.</Alert>
            ) : (
              <Alert tone="danger">{submitError.message}</Alert>
            ))}
        </div>
        <div>
          <button type="submit" className="ds-btn ds-btn--cta" aria-disabled={sending ? true : undefined}>
            {sending ? "Wysyłanie…" : "Wyślij pomysł do Hubu"}
          </button>
        </div>
        <p className="ds-sr-only" aria-live="polite">
          {status}
        </p>
      </div>
    </form>
  );
}
