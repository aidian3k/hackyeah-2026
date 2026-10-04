import type { ReactNode } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const NEW_WINDOW = <span className="ds-sr-only"> (otwiera się w nowym oknie)</span>;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="m-0 text-h2 text-navy">
        {title}
      </h2>
      {children}
    </section>
  );
}

const LIST = "m-0 flex flex-col gap-2 pl-6 text-body-lg text-ink";

/** Deklaracja dostępności (feature-2026-10-04-2), link w stopce. Bez twierdzeń o audycie. */
export function AccessibilityPage() {
  useDocumentTitle("Deklaracja dostępności");
  return (
    <div className="ds-page max-w-3xl">
      <header className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="m-0 text-h1 text-navy">
          Deklaracja dostępności
        </h1>
        <p className="m-0 text-body-lg text-ink">
          Serwis Działu Innowacji Społecznych ROPS w Krakowie projektujemy tak, aby spełniał standard WCAG 2.1 na
          poziomie AA.
        </p>
      </header>

      <Section id="ulatwienia" title="Ułatwienia na stronie">
        <ul className={LIST}>
          <li>
            <strong>Rozmiar tekstu</strong> — przyciski A, A+ i A++ w prawym górnym rogu powiększają cały serwis.
          </li>
          <li>
            <strong>Wysoki kontrast</strong> — przycisk z ikoną koła przełącza żółty tekst na czarnym tle.
          </li>
          <li>Oba ustawienia zapamiętujemy w tej przeglądarce.</li>
          <li>
            <strong>Przejdź do treści</strong> — pierwszy link na stronie (widoczny po naciśnięciu Tab) pomija menu.
          </li>
          <li>Serwis działa także po powiększeniu w przeglądarce do 200% i na telefonie.</li>
          <li>Ikony mają opisy dla czytników ekranu, a linki do innych serwisów informują o nowym oknie.</li>
        </ul>
      </Section>

      <Section id="klawiatura" title="Obsługa klawiaturą">
        <ul className={LIST}>
          <li>
            <kbd>Tab</kbd> i <kbd>Shift</kbd> + <kbd>Tab</kbd> — przejście do następnego i poprzedniego elementu.
          </li>
          <li>
            <kbd>Enter</kbd> — otwarcie linku lub wysłanie formularza; <kbd>Spacja</kbd> — naciśnięcie przycisku.
          </li>
          <li>Element, na którym jesteś, ma wyraźną ramkę.</li>
        </ul>
      </Section>

      <Section id="kontakt" title="Zgłoś problem z dostępnością">
        <p className="m-0 text-body-lg text-ink">
          Jeśli coś nie działa albo potrzebujesz informacji w innej formie, napisz na{" "}
          <a href="mailto:biuro@rops.krakow.pl">biuro@rops.krakow.pl</a> lub zadzwoń: (+48 12) 422 06 36.
        </p>
        <p className="m-0 text-body-lg text-ink">
          Informacje o dostępności siedziby ROPS:{" "}
          <a href="https://rops.krakow.pl/udogodnienia-dla-niepelnosprawnych" target="_blank" rel="noopener noreferrer">
            udogodnienia dla osób z niepełnosprawnościami
            {NEW_WINDOW}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
