import { useEffect, useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_ACCOUNTS, roleHome, roleLabel, useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Logowanie");
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const id = useId();
  const usernameId = `${id}-username`;
  const passwordId = `${id}-password`;
  const errorId = `${id}-error`;

  const [username, setUsername] = useState(AUTH_ACCOUNTS[0]?.username ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) navigate(roleHome(session.role), { replace: true });
  }, [navigate, session]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const account = AUTH_ACCOUNTS.find(
      (item) => item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password,
    );
    const ok = login(username, password);
    if (!ok) {
      setError("Nieprawidłowy login lub hasło.");
      return;
    }
    setError("");
    navigate(roleHome(account?.role ?? "reporter"), { replace: true });
  }

  return (
    <main id="main" tabIndex={-1} className="ds-page login-page">
      <header className="ds-stack">
        <h1>Zaloguj się</h1>
        <p>Wpisz login i hasło jednego z kont demo.</p>
      </header>

      <form className="ds-card ds-stack login-page__form" onSubmit={handleSubmit} noValidate>
        <div className="ds-field">
          <label className="ds-label" htmlFor={usernameId}>
            Login
          </label>
          <input
            id={usernameId}
            className="ds-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
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
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        {error && (
          <p id={errorId} className="ds-error">
            {error}
          </p>
        )}

        <div className="ds-cluster">
          <button type="submit" className="ds-btn ds-btn--primary">
            Zaloguj
          </button>
        </div>
      </form>

      <section className="ds-stack" aria-label="Konta demo">
        <h2>Konta startowe</h2>
        <div className="ds-grid">
          {AUTH_ACCOUNTS.map((account) => (
            <article key={account.username} className="ds-card ds-stack">
              <div className="ds-stack">
                <h3>{account.displayName}</h3>
                <p>{roleLabel(account.role)}</p>
              </div>
              <dl className="ds-meta ds-meta--small">
                <div className="ds-meta__item">
                  <dt>Login</dt>
                  <dd>{account.username}</dd>
                </div>
                <div className="ds-meta__item">
                  <dt>Hasło</dt>
                  <dd>{account.password}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
