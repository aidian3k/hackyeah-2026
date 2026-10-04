import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/Alert";
import { loginHref, roleHome, safeNext, useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Field = "email" | "username" | "password" | "confirm";
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["email", "username", "password", "confirm"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

function validate(email: string, username: string, password: string, confirm: string): Errors {
  const errors: Errors = {};
  if (!email.trim()) errors.email = "Wpisz adres e-mail.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Wpisz adres e-mail w formacie nazwa@domena.pl.";
  if (!username.trim()) errors.username = "Wpisz login.";
  if (!password) errors.password = "Wpisz hasło.";
  else if (password.length < PASSWORD_MIN) errors.password = `Hasło musi mieć co najmniej ${PASSWORD_MIN} znaków.`;
  if (!confirm) errors.confirm = "Powtórz hasło.";
  else if (password && confirm !== password) errors.confirm = "Hasła nie są takie same.";
  return errors;
}

/** Rejestracja (feature-2026-10-04-8): zawsze konto reportera, zapisane tylko w tej przeglądarce. */
export function RegisterPage() {
  useDocumentTitle("Załóż konto");
  const { session, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  const id = useId();
  const fieldId = (f: Field) => `${id}-${f}`;
  const errorId = (f: Field) => `${id}-${f}-blad`;
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const [values, setValues] = useState<Record<Field, string>>({ email: "", username: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});

  // Zalogowany (także zaraz po udanej rejestracji) nie zostaje na tym ekranie.
  useEffect(() => {
    if (session) navigate(next ?? roleHome(session.role), { replace: true });
  }, [navigate, next, session]);

  function showErrors(found: Errors) {
    setErrors(found);
    const first = FIELDS.find((f) => found[f]);
    if (first) refs.current[first]?.focus();
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate(values.email, values.username, values.password, values.confirm);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    const result = register({ email: values.email, username: values.username, password: values.password });
    if ("error" in result) {
      showErrors(
        result.error === "username_taken"
          ? { username: "Ten login jest już zajęty. Wybierz inny." }
          : { email: "Na ten adres e-mail jest już założone konto. Zaloguj się." },
      );
    }
  }

  const input = (field: Field, label: string, type: string, autoComplete: string, hint?: string) => {
    const error = errors[field];
    const hintId = hint ? `${fieldId(field)}-podpowiedz` : null;
    const describedBy = [hintId, error ? errorId(field) : null].filter(Boolean).join(" ") || undefined;
    return (
      <div className="ds-field">
        <label className="ds-label" htmlFor={fieldId(field)}>
          {label}
        </label>
        {hint && (
          <p id={hintId ?? undefined} className="ds-hint">
            {hint}
          </p>
        )}
        <input
          ref={(el) => {
            refs.current[field] = el;
          }}
          id={fieldId(field)}
          className="ds-input"
          type={type}
          value={values[field]}
          onChange={(e) => {
            setValues((v) => ({ ...v, [field]: e.target.value }));
            if (error) setErrors((prev) => ({ ...prev, [field]: undefined }));
          }}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {error && (
          <p id={errorId(field)} className="ds-error">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="ds-page max-w-lg">
      <header className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          Załóż konto
        </h1>
        <p className="m-0 text-body-lg text-ink">
          Konto pozwala zgłosić pomysł, zadać pytanie zespołowi Hubu i śledzić swoje zgłoszenia.
        </p>
      </header>

      {next && <Alert tone="info">Załóż konto albo zaloguj się, aby przejść dalej.</Alert>}

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate aria-label="Rejestracja">
        {input("email", "E-mail", "email", "email")}
        {input("username", "Login", "text", "username")}
        {input("password", "Hasło", "password", "new-password", `Co najmniej ${PASSWORD_MIN} znaków.`)}
        {input("confirm", "Powtórz hasło", "password", "new-password")}

        <div className="flex flex-col items-start gap-4">
          <button type="submit" className="ds-btn ds-btn--primary">
            Załóż konto
          </button>
        </div>
      </form>

      <p className="m-0 text-body text-ink">
        Masz już konto?{" "}
        <Link className="text-navy" to={next ? loginHref(next) : "/login"}>
          Zaloguj się
        </Link>
      </p>

      <p className="m-0">
        <Link className="ds-btn ds-btn--link px-0" to="/">
          Wróć do wyszukiwania
        </Link>
      </p>
    </div>
  );
}
