import { useEffect, useId, useRef, type ReactNode } from "react";
import type { ApiError } from "@/api/client";
import type { KnowledgeType, SolutionAdminDetail, SolutionKind, SolutionUpsert } from "@/api/types";
import { GminaSelect } from "@/components/GminaSelect";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { KNOWLEDGE_TYPE_LABELS } from "@/lib/labels";

// Limity lustrzane do SolutionUpsert w backendzie (api/schemas.py).
const LIMITS = {
  titleMin: 3,
  titleMax: 200,
  summaryMin: 10,
  summaryMax: 2000,
  bodyMax: 20_000,
  tagsMax: 20,
  stepsMax: 30,
  mediaMax: 10,
} as const;

const MEDIA_TYPE_LABELS: Record<string, string> = {
  video: "Film",
  document: "Dokument",
  materials: "Materiały",
  link: "Link",
};

const REEMBED_HINT = "Zmiana tego pola odświeży wyszukiwanie.";

export interface MediaRow {
  type: string;
  title: string;
  url: string;
}

/** Stan formularza: same napisy i listy; tagi jako jeden napis rozdzielany przecinkami. */
export interface SolutionFormValues {
  title: string;
  summary: string;
  body: string;
  knowledge_type: KnowledgeType | null;
  category: string;
  gmina: string | null;
  organization: string;
  target_group: string;
  cost_range: string;
  tags: string;
  steps: string[];
  source_name: string;
  source_url: string;
  media: MediaRow[];
}

export type SolutionFormErrors = Record<string, string>;

export function toFormValues(detail: SolutionAdminDetail | null): SolutionFormValues {
  return {
    title: detail?.title ?? "",
    summary: detail?.summary ?? "",
    body: detail?.body ?? "",
    knowledge_type: detail?.knowledge_type ?? null,
    category: detail?.category ?? "",
    gmina: detail?.gmina ?? null,
    organization: detail?.organization ?? "",
    target_group: detail?.target_group ?? "",
    cost_range: detail?.cost_range ?? "",
    tags: detail?.tags.join(", ") ?? "",
    steps: detail?.implementation_steps ?? [],
    source_name: detail?.source_name ?? "",
    source_url: detail?.source_url ?? "",
    media: detail?.media.map((m) => ({ type: m.type, title: m.title ?? "", url: m.url })) ?? [],
  };
}

const orNull = (s: string) => s.trim() || null;

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

/** Pełny obiekt dla PUT: puste napisy w polach opcjonalnych jako null, puste wiersze list pominięte. */
export function fromFormValues(v: SolutionFormValues): SolutionUpsert {
  return {
    title: v.title.trim(),
    summary: v.summary.trim(),
    body: v.body.trim(),
    knowledge_type: v.knowledge_type,
    organization: orNull(v.organization),
    gmina: v.gmina,
    category: v.category || null,
    tags: splitTags(v.tags),
    target_group: orNull(v.target_group),
    cost_range: orNull(v.cost_range),
    implementation_steps: v.steps.map((s) => s.trim()).filter(Boolean),
    source_url: orNull(v.source_url),
    source_name: orNull(v.source_name),
    media: v.media
      .filter((m) => m.url.trim() || m.title.trim())
      .map((m) => ({ type: m.type, url: m.url.trim(), title: orNull(m.title) })),
  };
}

// Błędy schematu (pydantic) przychodzą po angielsku — dla tych pól pokazujemy własny komunikat.
const SCHEMA_FIELD_MESSAGES: Record<string, string> = {
  title: `Tytuł musi mieć od ${LIMITS.titleMin} do ${LIMITS.titleMax} znaków.`,
  summary: `Streszczenie musi mieć od ${LIMITS.summaryMin} do ${LIMITS.summaryMax} znaków.`,
  body: "Treść może mieć najwyżej 20 000 znaków.",
  tags: `Wpisz najwyżej ${LIMITS.tagsMax} tagów.`,
  implementation_steps: `Wpisz najwyżej ${LIMITS.stepsMax} kroków.`,
  media: "Każdy materiał musi mieć adres URL.",
};
// Pola z walidacją w api/admin_content.py — komunikat backendu jest już po polsku.
const SERVER_FIELDS = ["gmina", "category", "knowledge_type", "source_url", "source_name"];

/** 422 „pole: opis” i 409 SOURCE_URL_TAKEN → błąd przypięty do pola; inne błędy → {}. */
export function fieldErrorFromApi(err: ApiError): SolutionFormErrors {
  if (err.status === 409 && err.code === "SOURCE_URL_TAKEN") return { source_url: err.message };
  if (err.status !== 422) return {};
  const field = err.message.split(":", 1)[0]?.split(".", 1)[0]?.trim() ?? "";
  const schemaMessage = SCHEMA_FIELD_MESSAGES[field];
  if (schemaMessage) return { [field]: schemaMessage };
  if (SERVER_FIELDS.includes(field)) return { [field]: err.message.slice(field.length + 1).trim() || err.message };
  return {};
}

interface Props {
  kind: SolutionKind;
  values: SolutionFormValues;
  onChange(values: SolutionFormValues): void;
  errors: SolutionFormErrors;
  disabled?: boolean;
  /** Stopka formularza (przyciski zapisu) — dostarcza strona. */
  children?: ReactNode;
  onSubmit(): void;
}

const fieldsetCls = "m-0 flex min-w-0 flex-col gap-6 border-0 p-0";
const legendCls = "mb-4 p-0 font-sans text-h2 text-navy";

/** Formularz treści wpisu bazy wiedzy (Moduł 6) — wspólny dla tworzenia i edycji. */
export function SolutionForm({ kind, values, onChange, errors, disabled, children, onSubmit }: Props) {
  const uid = useId();
  const id = (key: string) => `${uid}-${key}`;
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();

  // Po „Dodaj krok” / „Dodaj materiał” fokus trafia do nowego pola (po renderze).
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });

  function set<K extends keyof SolutionFormValues>(key: K, value: SolutionFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function describedBy(key: string, extra: string[] = []): string | undefined {
    const parts = [...extra, errors[key] ? `${id(key)}-error` : ""].filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  }

  function fieldError(key: string) {
    return errors[key] ? (
      <p className="ds-error" id={`${id(key)}-error`}>
        {errors[key]}
      </p>
    ) : null;
  }

  function textInput(key: keyof SolutionFormValues & string, label: string, opts: { hint?: string; type?: string } = {}) {
    return (
      <div className="ds-field">
        <label className="ds-label" htmlFor={id(key)}>
          {label}
        </label>
        {opts.hint && (
          <p className="ds-hint" id={`${id(key)}-hint`}>
            {opts.hint}
          </p>
        )}
        <input
          id={id(key)}
          className="ds-input"
          type={opts.type ?? "text"}
          value={values[key] as string}
          onChange={(e) => set(key, e.target.value)}
          disabled={disabled}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={describedBy(key, opts.hint ? [`${id(key)}-hint`] : [])}
        />
        {fieldError(key)}
      </div>
    );
  }

  const setStep = (i: number, text: string) => set("steps", values.steps.map((s, j) => (j === i ? text : s)));
  const addStep = () => {
    pendingFocus.current = id(`step-${values.steps.length}`);
    set("steps", [...values.steps, ""]);
  };
  const removeStep = (i: number) => {
    pendingFocus.current = values.steps.length > 1 ? id(`step-${Math.max(0, i - 1)}`) : id("add-step");
    set("steps", values.steps.filter((_, j) => j !== i));
  };

  const setMedia = (i: number, patch: Partial<MediaRow>) =>
    set("media", values.media.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const addMedia = () => {
    pendingFocus.current = id(`media-${values.media.length}-type`);
    set("media", [...values.media, { type: "video", title: "", url: "" }]);
  };
  const removeMedia = (i: number) => {
    pendingFocus.current = values.media.length > 1 ? id(`media-${Math.max(0, i - 1)}-type`) : id("add-media");
    set("media", values.media.filter((_, j) => j !== i));
  };

  return (
    <form
      className="flex flex-col gap-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Treść</legend>

        {kind === "KNOWLEDGE" && (
          <div className="ds-field">
            <label className="ds-label" htmlFor={id("knowledge_type")}>
              Rodzaj wiedzy
            </label>
            <select
              id={id("knowledge_type")}
              className="ds-select"
              value={values.knowledge_type ?? "REPORT"}
              onChange={(e) => set("knowledge_type", e.target.value as KnowledgeType)}
              disabled={disabled}
              aria-invalid={errors.knowledge_type ? true : undefined}
              aria-describedby={describedBy("knowledge_type")}
            >
              {(Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeType[]).map((k) => (
                <option key={k} value={k}>
                  {KNOWLEDGE_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
            {fieldError("knowledge_type")}
          </div>
        )}

        <div className="ds-field">
          <label className="ds-label" htmlFor={id("title")}>
            Tytuł
          </label>
          <p className="ds-hint" id={`${id("title")}-hint`}>
            {REEMBED_HINT}
          </p>
          <input
            id={id("title")}
            className="ds-input"
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            minLength={LIMITS.titleMin}
            maxLength={LIMITS.titleMax}
            required
            aria-required="true"
            disabled={disabled}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy("title", [`${id("title")}-hint`])}
          />
          {fieldError("title")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id("summary")}>
            Streszczenie
          </label>
          <p className="ds-hint" id={`${id("summary")}-hint`}>
            {REEMBED_HINT} Od {LIMITS.summaryMin} do {LIMITS.summaryMax} znaków.
          </p>
          <textarea
            id={id("summary")}
            className="ds-textarea"
            rows={4}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            minLength={LIMITS.summaryMin}
            maxLength={LIMITS.summaryMax}
            required
            aria-required="true"
            disabled={disabled}
            aria-invalid={errors.summary ? true : undefined}
            aria-describedby={describedBy("summary", [`${id("summary")}-hint`])}
          />
          {fieldError("summary")}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id("body")}>
            Treść (opcjonalnie)
          </label>
          <p className="ds-hint" id={`${id("body")}-hint`}>
            {REEMBED_HINT}
          </p>
          <textarea
            id={id("body")}
            className="ds-textarea"
            rows={10}
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            maxLength={LIMITS.bodyMax}
            disabled={disabled}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={describedBy("body", [`${id("body")}-hint`])}
          />
          {fieldError("body")}
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Kroki wdrożenia</legend>
        <p className="ds-hint m-0" id={`${id("steps")}-hint`}>
          Najwyżej {LIMITS.stepsMax} kroków. Puste kroki pomijamy przy zapisie.
        </p>
        {values.steps.length > 0 && (
          <ol className="m-0 flex flex-col gap-4 p-0 pl-6">
            {values.steps.map((step, i) => (
              <li key={i} className="flex flex-wrap items-end gap-3">
                <div className="ds-field min-w-0 flex-1">
                  <label className="ds-label" htmlFor={id(`step-${i}`)}>
                    Krok {i + 1}
                  </label>
                  <input
                    id={id(`step-${i}`)}
                    className="ds-input"
                    type="text"
                    value={step}
                    onChange={(e) => setStep(i, e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <button
                  type="button"
                  className="ds-btn ds-btn--small"
                  onClick={() => removeStep(i)}
                  disabled={disabled}
                  aria-label={`Usuń krok ${i + 1}`}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ol>
        )}
        {fieldError("implementation_steps")}
        <div>
          <button
            id={id("add-step")}
            type="button"
            className="ds-btn"
            onClick={addStep}
            disabled={disabled || values.steps.length >= LIMITS.stepsMax}
            aria-describedby={`${id("steps")}-hint`}
          >
            Dodaj krok
          </button>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Opis wpisu</legend>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id("category")}>
            Wyzwanie
          </label>
          <select
            id={id("category")}
            className="ds-select"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            disabled={disabled}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={describedBy("category", taxonomyError ? [`${id("category")}-load-error`] : [])}
          >
            <option value="">— brak —</option>
            {taxonomy.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
          </select>
          {taxonomyError && (
            <p className="ds-error" id={`${id("category")}-load-error`}>
              Nie udało się wczytać listy wyzwań.
            </p>
          )}
          {fieldError("category")}
        </div>

        <GminaSelect
          id={id("gmina")}
          label="Gmina (opcjonalnie)"
          hint="Powiat uzupełni się sam na podstawie gminy."
          value={values.gmina}
          onChange={(g) => set("gmina", g)}
          error={errors.gmina}
        />

        {textInput("organization", "Organizacja")}
        {textInput("target_group", "Grupa docelowa", { hint: "Np. seniorzy mieszkający samotnie." })}
        {textInput("cost_range", "Koszt", { hint: "Np. do 10 tys. zł." })}
        {textInput("tags", "Tagi", { hint: `Rozdziel przecinkiem. Najwyżej ${LIMITS.tagsMax}.` })}
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Źródło i materiały</legend>

        {textInput("source_name", "Nazwa źródła", { hint: "Np. Biblioteka ROPS Kraków." })}
        {textInput("source_url", "Adres źródła", { type: "url", hint: "Pełny adres, np. https://…" })}

        {values.media.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-6 p-0">
            {values.media.map((m, i) => {
              const types = m.type in MEDIA_TYPE_LABELS ? MEDIA_TYPE_LABELS : { ...MEDIA_TYPE_LABELS, [m.type]: m.type };
              return (
                <li key={i} className="flex flex-col gap-3 rounded-md border border-solid border-line p-4">
                  <p className="m-0 font-sans text-label text-navy">Materiał {i + 1}</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="ds-field">
                      <label className="ds-label" htmlFor={id(`media-${i}-type`)}>
                        Typ
                      </label>
                      <select
                        id={id(`media-${i}-type`)}
                        className="ds-select"
                        value={m.type}
                        onChange={(e) => setMedia(i, { type: e.target.value })}
                        disabled={disabled}
                      >
                        {Object.entries(types).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ds-field min-w-0 flex-1">
                      <label className="ds-label" htmlFor={id(`media-${i}-title`)}>
                        Tytuł
                      </label>
                      <input
                        id={id(`media-${i}-title`)}
                        className="ds-input"
                        type="text"
                        value={m.title}
                        onChange={(e) => setMedia(i, { title: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="ds-field">
                    <label className="ds-label" htmlFor={id(`media-${i}-url`)}>
                      Adres URL
                    </label>
                    <input
                      id={id(`media-${i}-url`)}
                      className="ds-input"
                      type="url"
                      value={m.url}
                      onChange={(e) => setMedia(i, { url: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="ds-btn ds-btn--small"
                      onClick={() => removeMedia(i)}
                      disabled={disabled}
                      aria-label={`Usuń materiał ${i + 1}`}
                    >
                      Usuń
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {fieldError("media")}
        <div>
          <button
            id={id("add-media")}
            type="button"
            className="ds-btn"
            onClick={addMedia}
            disabled={disabled || values.media.length >= LIMITS.mediaMax}
          >
            Dodaj materiał
          </button>
        </div>
      </fieldset>

      {children}
    </form>
  );
}
