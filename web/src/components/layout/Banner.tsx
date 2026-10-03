import { ContrastToggle } from "./ContrastToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isProtectedPath, loginHref, useAuth } from "@/lib/auth";

/** Baner z nazwą i paskami marki. Paski występują tylko tutaj, raz na ekranie. */
export function Banner() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  return (
    <div className="ds-banner">
      <div className="ds-banner__brand">
        <span className="ds-banner__name">Splot</span>
        <span className="ds-banner__sub">Hub Innowacji Społecznych · ROPS Kraków</span>
      </div>
      <svg className="ds-banner__stripes" viewBox="0 0 712 176" aria-hidden="true" focusable="false">
        <polygon className="s-m" points="47,0 171,0 124,176 0,176" />
        <polygon className="s-b" points="177,0 286,0 320,176 211,176" />
        <polygon className="s-c" points="289,0 385,0 350,176 255,176" />
        <polygon className="s-o" points="287.5,7.8 320,176 255,176" />
        <polygon className="s-g" points="503,0 583,0 625,176 545,176" />
        <polygon className="s-y" points="700,0 712,0 712,176 662,176" />
      </svg>
      <div className="ds-banner__tools">
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
