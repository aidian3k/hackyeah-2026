import { useEffect, useId, useState, type FormEvent } from "react";
import { api, type ApiError } from "@/api/client";
import type { InnovationTestApplicationPublic, TesterType } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { plural } from "@/lib/format";
import { TESTER_TYPE_FORM_OPTIONS, TESTER_TYPE_LABELS } from "@/lib/labels";

interface Props {
  testId: number;
  onSubmitted: (result: InnovationTestApplicationPublic) => void;
}

// Limity lustrzane do InnovationTestApplicationCreate (api/schemas.py) i M4_MOTIVATION_MAX_CHARS.
const LIMITS = {
  nameMin: 2,
  nameMax: 300,
  emailMax: 320,
  addressMax: 300,
  motivationMax: 4000,
} as const;

// Jak _EMAIL_RE w api/schemas.py.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FieldKey = "display_name" | "email" | "tester_type" | "address" | "motivation" | "consent";

// Kolejność pól w formularzu — pierwszy błąd w tej kolejności dostaje fokus.
const FIELD_ORDER: FieldKey[] = ["display_name", "email", "tester_type", "address", "motivation", "consent"];

// Komunikaty, gdy backend odrzuci pole (422), a walidacja w przeglądarce go nie złapała.
const SERVER_FIELD_MESSAGES: Record<FieldKey, string> = {
  display_name: `Imię lub nazwa musi mieć od ${LIMITS.nameMin} do ${LIMITS.nameMax} znaków.`,
  email: "Sprawdź adres e-mail, np. jan@example.pl.",
  tester_type: "Wybierz z listy, jako kto się zgłaszasz.",
  address: `Adres może mieć najwyżej ${LIMITS.addressMax} znaków.`,
  motivation: `Uzasadnienie może mieć najwyżej ${LIMITS.motivationMax} znaków.`,
  consent: "Zaznacz zgodę — bez niej Hub nie może się z Tobą skontaktować.",
};

const FALLBACK_CONSENT =
  "Wyrażam zgodę na kontakt w sprawie udziału w tej rekrutacji testerów oraz na przetwarzanie podanych danych przez Hub.";

interface Values {
  display_name: string;
  email: string;
  tester_type: TesterType;
  address: string;
  is_target_group_member: boolean;
  motivation: string;
  consent: boolean;
}

const EMPTY: Values = {
  display_name: "",
  email: "",
  tester_type: "RESIDENT",
  address: "",
  is_target_group_member: false,
  motivation: "",
  consent: false,
};

type Errors = Partial<Record<FieldKey, string>>;

function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.display_name.trim();
  if (!name) e.display_name = "Wpisz imię albo nazwę organizacji, np. „Anna” lub „Fundacja Razem”.";
  else if (name.length < LIMITS.nameMin) e.display_name = `Wpisz co najmniej ${LIMITS.nameMin} znaki.`;
  else if (name.length > LIMITS.nameMax) e.display_name = SERVER_FIELD_MESSAGES.display_name;

  const email = v.email.trim();
  if (!email) e.email = "Wpisz adres e-mail — na niego Hub wyśle informację o teście.";
  else if (email.length > LIMITS.emailMax || !EMAIL_RE.test(email)) e.email = SERVER_FIELD_MESSAGES.email;

  if (v.address.trim().length > LIMITS.addressMax) e.address = SERVER_FIELD_MESSAGES.address;
  if (v.motivation.trim().length > LIMITS.motivationMax) e.motivation = SERVER_FIELD_MESSAGES.motivation;
  if (!v.consent) e.consent = SERVER_FIELD_MESSAGES.consent;
  return e;
}

/** 422 VALIDATION_ERROR ma komunikat „pole: opis” — przypisz go do pola, bez technicznego tekstu. */
function errorsFromServer(err: ApiError): Errors | null {
  if (err.status !== 422) return null;
  const prefix = err.message.split(":", 1)[0]?.split(".", 1)[0]?.trim() ?? "";
  return (FIELD_ORDER as string[]).includes(prefix) ? { [prefix]: SERVER_FIELD_MESSAGES[prefix as FieldKey] } : null;
}

function firstError(errors: Errors): FieldKey | null {
  return FIELD_ORDER.find((k) => errors[k]) ?? null;
}

/** Zgłoszenie do testu: wymagane tylko imię/nazwa, e-mail i zgoda (feature-2026-10-04-6). */
export function ApplicationForm({ testId, onSubmitted }: Props) {
  const uid = useId();
  const ids = Object.fromEntries(FIELD_ORDER.map((k) => [k, `${uid}-${k}`])) as Record<FieldKey, string>;
  const targetId = `${uid}-target`;

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [consentText, setConsentText] = useState("");

  useEffect(() => {
    let active = true;
    api.innovationConsent().then(
      (meta) => {
        if (active) setConsentText(meta.text_pl);
      },
      () => {
        if (active) setConsentText(FALLBACK_CONSENT);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Poprawione pole przestaje być oznaczone jako błędne od razu, bez ponownego wysyłania.
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function focusField(key: FieldKey) {
    // Po renderze komunikatów błędu, żeby czytnik od razu przeczytał opis pola.
    requestAnimationFrame(() => document.getElementById(ids[key])?.focus());
  }

  function showErrors(next: Errors) {
    setErrors(next);
    const n = Object.values(next).filter(Boolean).length;
    setStatus(`Popraw ${n} ${plural(n, "pole", "pola", "pól")} w formularzu.`);
    const first = firstError(next);
    if (first) focusField(first);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    const found = validate(values);
    if (firstError(found)) {
      showErrors(found);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setStatus("Wysyłanie zgłoszenia…");
    try {
      const result = await api.applyInnovationTest(testId, {
        display_name: values.display_name.trim(),
        email: values.email.trim(),
        tester_type: values.tester_type,
        address: values.address.trim() || null,
        is_target_group_member: values.is_target_group_member,
        motivation: values.motivation.trim() || null,
        consent: true,
      });
      setStatus("");
      onSubmitted(result);
    } catch (err) {
      const apiErr = toApiError(err);
      const fieldErrors = errorsFromServer(apiErr);
      if (fieldErrors) {
        showErrors(fieldErrors);
      } else {
        setStatus("");
        setSubmitError(apiErr);
      }
    } finally {
      setSubmitting(false);
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

  const motivationLen = values.motivation.trim().length;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <p className="m-0 text-body text-ink-muted">
        Wystarczą imię i e-mail. Pozostałe pola pomogą Hubowi dobrać testerów, ale możesz je pominąć.
      </p>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.display_name}>
          Imię lub nazwa organizacji
        </label>
        <input
          id={ids.display_name}
          className="ds-input"
          value={values.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          maxLength={LIMITS.nameMax}
          autoComplete="name"
          required
          aria-required="true"
          aria-invalid={errors.display_name ? true : undefined}
          aria-describedby={describedBy("display_name")}
        />
        {fieldError("display_name")}
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.email}>
          E-mail
        </label>
        <p className="ds-hint" id={`${ids.email}-hint`}>
          Widzi go tylko Hub — napisze na niego, gdy zakwalifikuje Cię do testu.
        </p>
        <input
          id={ids.email}
          className="ds-input"
          type="email"
          inputMode="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          maxLength={LIMITS.emailMax}
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email", [`${ids.email}-hint`])}
        />
        {fieldError("email")}
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.tester_type}>
          Zgłaszam się jako
        </label>
        <select
          id={ids.tester_type}
          className="ds-select"
          value={values.tester_type}
          onChange={(e) => set("tester_type", e.target.value as TesterType)}
          aria-invalid={errors.tester_type ? true : undefined}
          aria-describedby={describedBy("tester_type")}
        >
          {TESTER_TYPE_FORM_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {TESTER_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {fieldError("tester_type")}
      </div>

      <label className="ds-choice" htmlFor={targetId}>
        <input
          id={targetId}
          className="ds-choice__input"
          type="checkbox"
          checked={values.is_target_group_member}
          onChange={(e) => set("is_target_group_member", e.target.checked)}
        />
        Należę do grupy, dla której jest to rozwiązanie (albo pracuję z nią na co dzień)
      </label>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.address}>
          Adres (opcjonalnie)
        </label>
        <p className="ds-hint" id={`${ids.address}-hint`}>
          Wystarczy miejscowość, np. „Niepołomice”. Przyda się, gdy test odbywa się na miejscu.
        </p>
        <input
          id={ids.address}
          className="ds-input"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          maxLength={LIMITS.addressMax}
          autoComplete="street-address"
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={describedBy("address", [`${ids.address}-hint`])}
        />
        {fieldError("address")}
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor={ids.motivation}>
          Dlaczego chcesz przetestować rozwiązanie? (opcjonalnie)
        </label>
        <p className="ds-hint" id={`${ids.motivation}-hint`}>
          Jedno-dwa zdania wystarczą, np. „Opiekuję się mamą i szukam takiego wsparcia”.
        </p>
        <textarea
          id={ids.motivation}
          className="ds-textarea"
          rows={3}
          value={values.motivation}
          onChange={(e) => set("motivation", e.target.value)}
          maxLength={LIMITS.motivationMax}
          aria-invalid={errors.motivation ? true : undefined}
          aria-describedby={describedBy("motivation", [`${ids.motivation}-hint`, `${ids.motivation}-counter`])}
        />
        <p
          className="ds-counter"
          id={`${ids.motivation}-counter`}
          data-state={motivationLen >= LIMITS.motivationMax * 0.9 ? "limit" : undefined}
        >
          {motivationLen} z {LIMITS.motivationMax} znaków
        </p>
        {fieldError("motivation")}
      </div>

      <div className="ds-field">
        <label className="ds-choice" htmlFor={ids.consent}>
          <input
            id={ids.consent}
            className="ds-choice__input"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
            required
            aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy("consent")}
          />
          {consentText || FALLBACK_CONSENT}
        </label>
        {fieldError("consent")}
      </div>

      <div role="alert" className="empty:hidden">
        {submitError && (
          <Alert tone="danger" title="Nie udało się wysłać zgłoszenia.">
            {submitError.message}
          </Alert>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="ds-btn ds-btn--cta" disabled={submitting} aria-disabled={submitting}>
          {submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
        </button>
      </div>

      <p className="ds-sr-only" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
