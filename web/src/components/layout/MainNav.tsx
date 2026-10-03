import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/rozwiazania", label: "Biblioteka innowacji" },
  { to: "/wiedza", label: "Wiedza" },
  { to: "/mam-pomysl", label: "Mam pomysł" },
  { to: "/moje-zgloszenia", label: "Moje zgłoszenia" },
];

/** Nawigacja publiczna. NavLink ustawia aria-current="page" na aktywnej pozycji. */
export function MainNav() {
  return (
    <nav className="ds-nav" aria-label="Główna">
      <NavLink to="/" end className="ds-nav__item ds-nav__home">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z" />
        </svg>
        Znajdź rozwiązanie
      </NavLink>
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className="ds-nav__item">
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
