import { NavLink } from "react-router-dom";
import { MODULE_NAMES } from "@/lib/modules";

/** Podnawigacja Zasobnika wiedzy: Wiedza o wyzwaniach i Biblioteka innowacji. */
export function ZasobnikNav() {
  return (
    <nav className="zasobnik-nav" aria-label={MODULE_NAMES.zasobnik}>
      <ul className="ds-cluster">
        <li>
          <NavLink to="/wiedza" end>
            Wiedza o wyzwaniach
          </NavLink>
        </li>
        <li>
          <NavLink to="/rozwiazania" end>
            Biblioteka innowacji
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
