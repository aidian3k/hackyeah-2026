import { Link, useLocation } from "react-router-dom";
import { useNewReplies } from "@/hooks/useNewReplies";
import { MODULE_NAMES } from "@/lib/modules";

/** Ścieżki Kreatora pomysłów — zakładka „Kreator pomysłów” w MainNav jest na nich aktywna. */
export const KREATOR_PATH_RE = /^\/(mam-pomysl|moje-pomysly|nabory|wnioski)(\/|$)/;

const TABS = [
  { to: "/mam-pomysl", label: "Nowy pomysł", match: /^\/mam-pomysl\/?$/ },
  // Fiszka i kanwa zapisanego pomysłu należą do „Moich pomysłów”.
  { to: "/moje-pomysly", label: "Moje pomysły", match: /^\/(moje-pomysly(\/|$)|mam-pomysl\/\d+)/ },
  { to: "/nabory", label: "Nabory", match: /^\/(nabory|wnioski)(\/|$)/ },
];

/**
 * Znacznik nowej odpowiedzi Hubu: kształt (kółko) + tekst dostępny, nie tylko kolor.
 * `compact` — w głównej nawigacji samo kółko z tekstem dla czytników ekranu.
 */
export function NewReplyBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  if (count <= 0) return null;
  const text = count === 1 ? "Nowa odpowiedź" : `Nowe odpowiedzi: ${count}`;
  return (
    <span className="ml-2 inline-flex items-center gap-1 align-middle">
      <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false" className="h-2.5 w-2.5 fill-current">
        <circle cx="5" cy="5" r="5" />
      </svg>
      {compact ? (
        <span className="ds-sr-only">, {text.toLowerCase()} od Hubu</span>
      ) : (
        <span className="text-small">{text}</span>
      )}
    </span>
  );
}

/** Zakładki Kreatora pomysłów (wzór ZasobnikNav). Przy „Moich pomysłach” znacznik nowej odpowiedzi. */
export function KreatorNav() {
  const { pathname } = useLocation();
  const newReplies = useNewReplies();
  return (
    <nav aria-label={MODULE_NAMES.kreator} className="border-b border-line">
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
                {tab.to === "/moje-pomysly" && <NewReplyBadge count={newReplies} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
