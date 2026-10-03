import { ContrastToggle } from "./ContrastToggle";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, roleLabel } from "@/lib/auth";

/** Baner z nazwą i paskami marki. Paski występują tylko tutaj, raz na ekranie. */
export function Banner() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

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
          <div className="ds-cluster">
            <span className="ds-tag">
              {session.displayName} · {roleLabel(session.role)}
            </span>
            <button
              type="button"
              className="ds-btn ds-btn--small"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Wyloguj się
            </button>
          </div>
        ) : (
          <Link className="ds-btn ds-btn--small" to="/login">
            Zaloguj się
          </Link>
        )}
        <ContrastToggle />
      </div>
    </div>
  );
}
