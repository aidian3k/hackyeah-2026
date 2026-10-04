import { ContrastToggle } from "./ContrastToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContrast } from "@/hooks/useContrast";
import { isProtectedPath, loginHref, useAuth } from "@/lib/auth";

/** Baner w stylu nagłówka rops.krakow.pl: logotyp ROPS z nazwą działu (jeden link do strony głównej), narzędzia po prawej. */
export function Banner() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [highContrast] = useContrast();

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 overflow-hidden bg-surface px-4 py-4 md:px-6">
      {/* Paski marki (tylko tu, raz na ekranie): dekoracja między logo a narzędziami, od szerokości xl. */}
      <svg
        className="pointer-events-none absolute inset-y-0 left-[40%] hidden h-full w-auto xl:block"
        viewBox="0 0 712 176"
        aria-hidden="true"
        focusable="false"
      >
        <polygon className="s-m" points="47,0 171,0 124,176 0,176" />
        <polygon className="s-b" points="177,0 286,0 320,176 211,176" />
        <polygon className="s-c" points="289,0 385,0 350,176 255,176" />
        <polygon className="s-o" points="287.5,7.8 320,176 255,176" />
        <polygon className="s-g" points="503,0 583,0 625,176 545,176" />
        <polygon className="s-y" points="700,0 712,0 712,176 662,176" />
      </svg>
      <Link
        to="/"
        className="relative flex flex-wrap items-center gap-x-6 gap-y-2 no-underline"
        aria-label="Strona główna — Regionalny Ośrodek Polityki Społecznej w Krakowie, Dział Innowacji Społecznych"
      >
        <img
          className="h-16 w-auto md:h-20"
          src={highContrast ? "/rops-logo-i.png" : "/rops-logo.png"}
          width={439}
          height={142}
          alt=""
        />
        <span className="border-l-4 border-accent pl-3 font-sans text-h3 text-navy">
          Dział Innowacji Społecznych
        </span>
      </Link>
      <div className="relative flex flex-col items-start gap-3 md:items-end">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
          <a
            href="http://epuap.gov.pl/kup/searchContentServlet?nazwaOpisu=pismo+ogolne_do_urzedu&idPodmiotu=ropskrakow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <img
              src={highContrast ? "/epuap-logo-i.png" : "/epuap-logo.png"}
              width={70}
              height={13}
              alt="ePUAP — pismo ogólne do ROPS (otwiera się w nowej karcie)"
            />
          </a>
          <a
            href="http://bip.malopolska.pl/ropswkrakowie/Article/get/id,188397.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <img
              src={highContrast ? "/bip-logo-i.png" : "/bip-logo.png"}
              width={42}
              height={16}
              alt="Biuletyn Informacji Publicznej ROPS (otwiera się w nowej karcie)"
            />
          </a>
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
              <Link
                className="ds-btn ds-btn--small"
                to={loginHref(pathname + search)}
              >
                Zaloguj się
              </Link>
            )
          )}
          <ContrastToggle />
        </div>
      </div>
    </div>
  );
}
