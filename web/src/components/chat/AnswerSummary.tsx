import type { MouseEvent, ReactNode } from "react";
import type { SolutionCard } from "@/api/types";

interface Props {
  /** Sklejone tokeny streszczenia. */
  answer: string;
  /** Karty, do których odnoszą się cytowania [n] (n = rank). */
  cards: SolutionCard[];
  /** true do zdarzenia `done` — czytnik przeczyta tekst raz, w całości. */
  busy: boolean;
}

const CITE_RE = /\[(\d+)\]/g;

export function cardAnchorId(rank: number): string {
  return `rozwiazanie-${rank}`;
}

/** Przewija do karty i przenosi na nią fokus (karta dostaje tabindex=-1 dopiero teraz). */
function focusCard(e: MouseEvent<HTMLAnchorElement>, rank: number) {
  const target = document.getElementById(cardAnchorId(rank));
  if (!target) return; // zostaw domyślne działanie odnośnika
  e.preventDefault();
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  target.focus({ preventScroll: true });
}

/** Zamienia [n] na odnośniki do kart. Niedomknięte „[1” na końcu zostaje tekstem do następnego tokenu. */
function renderParagraph(text: string, titles: Map<number, string>): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE_RE)) {
    const n = Number(m[1]);
    const title = titles.get(n);
    if (title === undefined) continue; // brak karty o tym numerze — zostaje zwykłym tekstem
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <a
        key={`c${start}`}
        className="ds-cite"
        href={`#${cardAnchorId(n)}`}
        aria-label={`źródło ${n}: ${title}`}
        onClick={(e) => focusCard(e, n)}
      >
        [{n}]
      </a>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Streszczenie z cytowaniami. Bez dangerouslySetInnerHTML: tekst trafia do Reacta jako węzły tekstowe. */
export function AnswerSummary({ answer, cards, busy }: Props) {
  const titles = new Map(cards.map((c) => [c.rank, c.title]));
  const paragraphs = answer.split(/\n{2,}/).filter((p) => p.trim() !== "");

  return (
    <section className="answer-summary ds-stack" aria-labelledby="podsumowanie-naglowek">
      <div className="answer-summary__head">
        <h3 id="podsumowanie-naglowek">Podsumowanie</h3>
        <p className="answer-summary__note">Przygotowane automatycznie na podstawie znalezionych rozwiązań.</p>
      </div>
      <div className="answer-summary__text" aria-live="polite" aria-busy={busy}>
        {paragraphs.map((p, i) => (
          <p key={i}>{renderParagraph(p, titles)}</p>
        ))}
      </div>
    </section>
  );
}
