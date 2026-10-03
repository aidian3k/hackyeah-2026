import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { MODULE_NAMES } from "@/lib/modules";

/** Nawigacja publiczna — zakładki nazwane jak moduły w base.md, zależne od roli. NavLink ustawia aria-current="page". */
export function MainNav() {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const isAdmin = session?.role === "administrator";
  // Zasobnik wiedzy obejmuje Wiedzę i Bibliotekę innowacji (z kartami rozwiązań).
  const inZasobnik = /^\/(wiedza|rozwiazania)(\/|$)/.test(pathname);

  return (
    <nav className="ds-nav" aria-label="Główna">
      <NavLink to="/" end className="ds-nav__item ds-nav__home">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z" />
        </svg>
        {MODULE_NAMES.matchmaking}
      </NavLink>
      <Link to="/wiedza" className="ds-nav__item" aria-current={inZasobnik ? "page" : undefined}>
        {MODULE_NAMES.zasobnik}
      </Link>
      <NavLink to="/testy" className="ds-nav__item">
        {MODULE_NAMES.tester}
      </NavLink>
      {isAdmin ? (
        <NavLink to="/panel" className="ds-nav__item">
          {MODULE_NAMES.panel}
        </NavLink>
      ) : (
        <>
          {/* Niezalogowany też widzi te zakładki — ekran pokaże komunikat z „Zaloguj się”. */}
          <NavLink to="/mam-pomysl" className="ds-nav__item">
            {MODULE_NAMES.kreator}
          </NavLink>
          <NavLink to="/moje-zgloszenia" className="ds-nav__item">
            Moje zgłoszenia
          </NavLink>
        </>
      )}
    </nav>
  );
}
