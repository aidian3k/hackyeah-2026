import { Link } from "react-router-dom";
import { useContrast } from "@/hooks/useContrast";
import { useAuth } from "@/lib/auth";
import { MODULE_NAMES } from "@/lib/modules";

const ROPS = "https://rops.krakow.pl";

/** Menu stopki: pozycje serwisu rops.krakow.pl związane z tą aplikacją (te same adresy). */
const ROPS_LINKS = [
  { label: "O ROPS", href: `${ROPS}/o-rops/zadania` },
  {
    label: "Programy i modele",
    href: `${ROPS}/programy-i-modele/regionalny-plan-rozwoju-uslug-spolecznych-i-deinstytucjonalizacji-wojewodztwa-malopolskiego`,
  },
  { label: "Realizowane projekty i zadania", href: `${ROPS}/realizowane-projekty-i-zadania/spoleczna-malopolska` },
  { label: "Kontakt", href: `${ROPS}/kontakt/regionalny-osrodek-polityki-spolecznej-w-krakowie` },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/ROPS.Krakow/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UC4KEW7FaoODgDKLxbUwhnVw" },
];

const MAP_HREF =
  "https://www.google.com/maps/search/?api=1&query=Regionalny+O%C5%9Brodek+Polityki+Spo%C5%82ecznej+w+Krakowie%2C+Piastowska+32";

const NEW_WINDOW = <span className="ds-sr-only"> (otwiera się w nowym oknie)</span>;

/** Stopka w stylu rops.krakow.pl: wyśrodkowane dane adresowe, menu ROPS, logotypy, polityka prywatności. */
export function Footer() {
  const { session } = useAuth();
  const [highContrast] = useContrast();
  const img = (name: string) => `/${name}${highContrast ? "-i" : ""}.png`;

  return (
    <footer className="mt-12 border-t border-line bg-surface-muted px-4 py-16 text-center font-sans text-body text-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
        <h2 className="m-0 font-sans text-h2 text-ink">Regionalny Ośrodek Polityki Społecznej w Krakowie</h2>

        <p className="m-0 flex flex-col items-center gap-3">
          <img src={img("rops-marker")} width={36} height={45} alt="" />
          <a className="ds-btn ds-btn--small" href={MAP_HREF} target="_blank" rel="noopener noreferrer">
            Dojazd{NEW_WINDOW}
          </a>
        </p>

        <address className="m-0 not-italic">
          <p className="m-0 text-label text-ink">
            30-070 Kraków, ul. Piastowska 32
            <br />
            tel./fax: (+48 12) 422 06 36
          </p>
        </address>

        <p className="m-0">
          <a className="font-sans text-h3 text-navy" href="mailto:biuro@rops.krakow.pl">
            e-mail: biuro@rops.krakow.pl
          </a>
        </p>

        <ul className="m-0 flex list-none flex-wrap justify-center gap-4 p-0">
          {SOCIAL_LINKS.map((s) => (
            <li key={s.label}>
              <a className="text-label text-navy" href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
                {NEW_WINDOW}
              </a>
            </li>
          ))}
        </ul>

        <nav aria-label="Serwis ROPS" className="w-full border-b border-line pb-6">
          <ul className="m-0 flex list-none flex-wrap justify-center gap-x-8 gap-y-3 p-0">
            {ROPS_LINKS.map((l) => (
              <li key={l.label}>
                <a className="text-label uppercase text-navy" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
            {session?.role === "administrator" && (
              <li>
                <Link className="text-label uppercase text-navy" to="/panel">
                  {MODULE_NAMES.panel}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link to="/" className="inline-flex">
            <img
              className="h-auto w-36"
              src={img("rops-logo")}
              width={439}
              height={142}
              alt="Regionalny Ośrodek Polityki Społecznej w Krakowie — strona główna"
            />
          </Link>
          <img
            className="h-auto w-64 max-w-full"
            src={img("malopolska-logo")}
            width={246}
            height={42}
            alt="Małopolska"
          />
        </div>

        <p className="m-0 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a className="text-small uppercase text-navy" href={`${ROPS}/polityka-prywatnosci`}>
            Polityka prywatności i wykorzystywania plików cookies
          </a>
          <Link className="text-small uppercase text-navy" to="/dostepnosc">
            Deklaracja dostępności
          </Link>
        </p>

        <p className="m-0 text-small text-ink-muted">
          Prototyp HackYeah 2026 — Dział Innowacji Społecznych, dane testowe.
        </p>
      </div>
    </footer>
  );
}
