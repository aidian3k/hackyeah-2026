import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/Alert";
import { roleHome, safeNext, useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Logowanie demo. Dane kont są tylko w README — ekran ich nie pokazuje. */
export function LoginPage() {
  useDocumentTitle("Logowanie");
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  const id = useId();
  const usernameId = `${id}-username`;
  const passwordId = `${id}-password`;
  const errorId = `${id}-error`;
  const usernameRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Zalogowany (także zaraz po udanym logowaniu) nie zostaje na tym ekranie.
  useEffect(() => {
    if (session) navigate(next ?? roleHome(session.role), { replace: true });
  }, [navigate, next, session]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (login(username, password)) return;
    setError("Nieprawidłowy login lub hasło.");
    usernameRef.current?.focus();
  }

  const invalid = error ? true : undefined;
  const describedBy = error ? errorId : undefined;

  return (
    <div className="ds-page max-w-lg">
      <header className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">Zaloguj się</h1>
        <p className="m-0 text-body-lg text-ink">
          Logowanie jest potrzebne, żeby zgłosić pomysł, zobaczyć swoje zgłoszenia albo otworzyć Panel
          administratora.
        </p>
      </header>

      {next && <Alert tone="info">Zaloguj się, aby przejść dalej.</Alert>}

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate aria-label="Logowanie">
        <div className="ds-field">
          <label className="ds-label" htmlFor={usernameId}>
            Login
          </label>
          <input
            ref={usernameRef}
            id={usernameId}
            className="ds-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={passwordId}>
            Hasło
          </label>
          <input
            id={passwordId}
            className="ds-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
          <p id={errorId} className="ds-error empty:hidden" role="alert">
            {error}
          </p>
        </div>

        <div className="flex flex-col items-start gap-4">
          <button type="submit" className="ds-btn ds-btn--primary">
            Zaloguj się
          </button>
        </div>
      </form>

      <p className="m-0">
        <Link className="ds-btn ds-btn--link px-0" to="/">
          Wróć do wyszukiwania
        </Link>
      </p>
    </div>
  );
}
