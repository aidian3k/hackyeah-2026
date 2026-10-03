import { ContrastToggle } from "./ContrastToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContrast } from "@/hooks/useContrast";
import { isProtectedPath, loginHref, useAuth } from "@/lib/auth";

/** Baner w stylu nagłówka rops.krakow.pl: logotyp ROPS (link do `/`), nazwa działu, narzędzia po prawej. */
export function Banner() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [highContrast] = useContrast();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-surface px-4 py-4 md:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/" className="inline-flex">
          <img
            className="h-16 w-auto md:h-20"
            src={highContrast ? "/rops-logo-i.png" : "/rops-logo.png"}
            width={439}
            height={142}
            alt="Regionalny Ośrodek Polityki Społecznej w Krakowie — strona główna"
          />
        </Link>
        <span className="border-l-4 border-accent pl-3 font-sans text-h3 text-navy">
          Dział Innowacji Społecznych
        </span>
      </div>
      <div className="flex items-center gap-2">
        {session ? (
          <button
            type="button"
            className="ds-btn ds-btn--small"
            onClick={() => {
              logout();
              // Z ekranu publicznego nie wyrzucamy; z ekranu wymagającego roli — na stronę główną.
              if (isProtectedPath(pathname)) navigate("/", { replace: true });
            }}
          >
            Wyloguj się
          </button>
        ) : (
          pathname !== "/login" && (
            <Link className="ds-btn ds-btn--small" to={loginHref(pathname + search)}>
              Zaloguj się
            </Link>
          )
        )}
        <ContrastToggle />
      </div>
    </div>
  );
}
