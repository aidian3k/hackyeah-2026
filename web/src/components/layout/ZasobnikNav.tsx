import { Link, useLocation } from "react-router-dom";
import { MODULE_NAMES } from "@/lib/modules";

const TABS = [
  { to: "/wiedza", label: "Wiedza o wyzwaniach", match: /^\/wiedza(\/wyzwania(\/|$)|\/?$)/ },
  { to: "/rozwiazania", label: "Biblioteka innowacji", match: /^\/rozwiazania(\/|$)/ },
  { to: "/wiedza/materialy", label: "Materiały", match: /^\/wiedza\/materialy\/?$/ },
];

/** Zakładki Zasobnika wiedzy. Aktywna także na podstronach (strona innowacji → „Biblioteka innowacji”). */
export function ZasobnikNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label={MODULE_NAMES.zasobnik} className="border-b border-line">
      <ul className="m-0 flex list-none flex-wrap gap-x-2 p-0">
        {TABS.map((tab) => {
          const active = tab.match.test(pathname);
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center px-3 py-2 font-sans text-nav text-navy no-underline hover:bg-surface-sunken ${
                  active ? "shadow-[inset_0_-4px_0_var(--accent)]" : ""
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
