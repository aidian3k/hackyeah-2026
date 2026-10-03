import { Link, NavLink, Outlet } from "react-router-dom";
import { useInboxCount } from "@/hooks/useInboxCount";
import { plural } from "@/lib/format";
import { MODULE_NAMES } from "@/lib/modules";
import { Banner } from "./Banner";
// Moduł 3: Kreator pomysłów
import { useIdeasCount } from "@/hooks/useIdeasCount";

/** Rama Panelu administratora: ten sam baner (paski raz na ekranie), nawigacja panelu z licznikiem „Nowe”. */
export function PanelLayout() {
  const inboxCount = useInboxCount();
  const showBadge = inboxCount !== null && inboxCount > 0;
  // Moduł 3: pomysły wysłane do Hubu (SUBMITTED), czekające na ocenę.
  const ideasCount = useIdeasCount();
  const showIdeasBadge = ideasCount !== null && ideasCount > 0;

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
          <NavLink to="/panel/testy" className="ds-nav__item">
            Testerzy
          </NavLink>
          {/* Moduł 3: Kreator pomysłów */}
          <NavLink to="/panel/pomysly" className="ds-nav__item">
            Pomysły
            {showIdeasBadge && (
              <>
                {" "}
                <span className="ds-badge" aria-hidden="true">
                  {ideasCount}
                </span>
                <span className="ds-sr-only">
                  , {ideasCount} {plural(ideasCount, "nowy pomysł", "nowe pomysły", "nowych pomysłów")}
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
