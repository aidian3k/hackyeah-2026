import { Link, Outlet, useLocation } from "react-router-dom";
import { Alert } from "@/components/Alert";
import { AppShell } from "@/components/layout/AppShell";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginHref, roleLabel, useAuth, type Role } from "@/lib/auth";

interface Props {
  requiredRole: Role;
  /** „panel”: przy dostępie renderuje `PanelLayout`, a komunikat — w ramie serwisu (`AppShell`). */
  layout?: "panel";
}

/**
 * Ochrona tras wg roli. Zamiast cichego przekierowania pokazuje w miejscu treści komunikat:
 * niezalogowanemu z przyciskiem „Zaloguj się” (powrót na ten sam ekran), złej roli — bez przycisku.
 */
export function RequireRole({ requiredRole, layout }: Props) {
  const { session } = useAuth();
  if (session?.role === requiredRole) return layout === "panel" ? <PanelLayout /> : <Outlet />;
  const notice = <AccessNotice requiredRole={requiredRole} loggedIn={session !== null} />;
  return layout === "panel" ? <AppShell>{notice}</AppShell> : notice;
}

function AccessNotice({ requiredRole, loggedIn }: { requiredRole: Role; loggedIn: boolean }) {
  useDocumentTitle(loggedIn ? "Brak dostępu" : "Wymagane logowanie");
  const { pathname, search } = useLocation();

  return (
    <div className="ds-page max-w-lg">
      <header className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">{loggedIn ? "Brak dostępu" : "Ta funkcja wymaga zalogowania"}</h1>
        <p className="m-0 text-body-lg text-ink">
          {loggedIn
            ? `Ta funkcja jest dostępna dla roli ${roleLabel(requiredRole)}.`
            : "Zaloguj się, a wrócimy tu od razu po zalogowaniu."}
        </p>
      </header>

      {loggedIn ? (
        <Alert tone="info">Przeglądanie i wyszukiwanie rozwiązań działa bez zmian.</Alert>
      ) : (
        <p className="m-0">
          <Link className="ds-btn ds-btn--primary" to={loginHref(pathname + search)}>
            Zaloguj się
          </Link>
        </p>
      )}

      <p className="m-0">
        <Link className="ds-btn ds-btn--link px-0" to="/">
          Wróć do wyszukiwania
        </Link>
      </p>
    </div>
  );
}
