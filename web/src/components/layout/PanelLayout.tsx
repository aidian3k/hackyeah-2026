import { Link, NavLink, Outlet } from "react-router-dom";
import { useCommWaitingCount } from "@/hooks/useCommCount";
import { useInboxCount } from "@/hooks/useInboxCount";
import { plural } from "@/lib/format";
import { MODULE_NAMES } from "@/lib/modules";
import { Banner } from "./Banner";

/** Rama Panelu administratora: ten sam baner (paski raz na ekranie), nawigacja panelu z licznikiem „Nowe”. */
export function PanelLayout() {
  const inboxCount = useInboxCount();
  const showBadge = inboxCount !== null && inboxCount > 0;
  const commCount = useCommWaitingCount(); // Moduł 5

  return (
    <>
      <a className="ds-skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="ds-header">
        <Banner />
        <nav className="ds-nav" aria-label={MODULE_NAMES.panel}>
          <NavLink to="/panel" end className="ds-nav__item">
            Nowe
            {showBadge && (
              <>
                {" "}
                <span className="ds-badge" aria-hidden="true">
                  {inboxCount}
                </span>
                <span className="ds-sr-only">
                  , {inboxCount} {plural(inboxCount, "nowa pozycja", "nowe pozycje", "nowych pozycji")}
                </span>
              </>
            )}
          </NavLink>
          <NavLink to="/panel/zgloszenia" className="ds-nav__item">
            Zgłoszenia
          </NavLink>
          <NavLink to="/panel/rozwiazania" className="ds-nav__item">
            Do zatwierdzenia
          </NavLink>
          {/* Moduł 6 */}
          <NavLink to="/panel/wiedza" className="ds-nav__item">
            Baza wiedzy
          </NavLink>
          {/* M3: Pomysły (K07) */}
          <NavLink to="/panel/testy" className="ds-nav__item">
            Testerzy
          </NavLink>
          {/* Moduł 5: rozmowy czekające na zespół Hubu */}
          <NavLink to="/panel/rozmowy" className="ds-nav__item relative">
            Rozmowy
            {commCount !== null && commCount > 0 && (
              <>
                {" "}
                <span className="ds-badge" aria-hidden="true">
                  {commCount}
                </span>
                <span className="ds-sr-only">
                  , {commCount} {plural(commCount, "czeka", "czekają", "czeka")} na odpowiedź
                </span>
              </>
            )}
          </NavLink>
          <NavLink to="/panel/trendy" className="ds-nav__item">
            Trendy
          </NavLink>
          <Link to="/" className="ds-nav__item">
            Wróć do serwisu
          </Link>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
