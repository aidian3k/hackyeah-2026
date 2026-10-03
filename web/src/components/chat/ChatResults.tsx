import type { SolutionCard as SolutionCardData } from "@/api/types";
import { Alert } from "@/components/Alert";
import { SolutionCard } from "@/components/SolutionCard";
import { AnswerSummary, cardAnchorId } from "@/components/chat/AnswerSummary";
import { FeedbackPrompt } from "@/components/chat/FeedbackPrompt";
import { FollowUp } from "@/components/chat/FollowUp";
import { KnowledgeList } from "@/components/chat/KnowledgeList";
import { NoMatchNotice } from "@/components/chat/NoMatchNotice";
import { ScaleNotice } from "@/components/chat/ScaleNotice";
import { StageProgress } from "@/components/chat/StageProgress";
import type { ChatState } from "@/lib/chatReducer";
import { plural } from "@/lib/format";
import "@/styles/chat-results.css";

interface Props {
  state: ChatState;
  onFollowUp(text: string): void;
}

/** id nagłówka „Wyniki” — cel fokusu po wysłaniu formularza (F08). */
export const RESULTS_HEADING_ID = "wyniki-naglowek";

const RETRACTED_NOTE = "Podsumowanie zostało wycofane. Poniżej zostają znalezione rozwiązania.";
const MORE_DETAILS = "Dopisz więcej szczegółów: kogo dotyczy problem, gdzie, od kiedy.";
const ANSWER_QUESTION = "Odpowiedz na pytanie z podsumowania, a poszukamy dokładniej.";

/** Krótki komunikat dla czytnika ekranu: ile znaleziono albo „nie wiem” (karty same nie są regionem live). */
function resultsAnnouncement(state: ChatState): string {
  if (state.noMatch) return state.noMatch.message_pl;
  if (!state.candidates) return "";
  const n = state.candidates.solutions.length;
  const more = state.candidates.also_see.length;
  if (n === 0 && more === 0) return "Nie znaleźliśmy pasujących rozwiązań.";
  const main = `Znaleźliśmy ${n} ${plural(n, "rozwiązanie", "rozwiązania", "rozwiązań")}.`;
  return more > 0 ? `${main} W sekcji „Zobacz też” jest jeszcze ${more}.` : main;
}

function CardList({ cards, label }: { cards: SolutionCardData[]; label: string }) {
  return (
    <ul className="ds-grid card-list" aria-label={label}>
      {cards.map((card) => (
        <li key={card.id}>
          <SolutionCard card={card} headingLevel={3} showRank id={cardAnchorId(card.rank)} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Wynik dopasowania: najpierw karty (od zdarzenia `candidates`), potem streszczenie z cytowaniami,
 * skala problemu i numer zgłoszenia. Frontend nie sortuje, nie filtruje i nie odcina kart.
 */
export function ChatResults({ state, onFollowUp }: Props) {
  const { phase, candidates, answer, answerRetracted, noMatch, saved, error, requestError, searchEventId } = state;

  if (phase === "idle") {
    // 422 (np. nieznana gmina) formularz pokazuje przy polu; tu tylko błąd ogólny (sieć, serwer).
    if (!requestError || requestError.status === 422) return null;
    return (
      <section className="chat-results" aria-labelledby={RESULTS_HEADING_ID}>
        <h2 id={RESULTS_HEADING_ID} tabIndex={-1}>
          Wyniki
        </h2>
        <div role="alert">
          <Alert tone="danger">{requestError.message}</Alert>
        </div>
      </section>
    );
  }

  const streaming = phase === "streaming";
  const done = phase === "done";
  const solutions = candidates?.solutions ?? [];
  const alsoSee = candidates?.also_see ?? [];
  const context = candidates?.context ?? [];
  const citable = [...solutions, ...alsoSee];

  // Pytanie doprecyzowujące (poza „nie wiem”, gdzie pole jest w NoMatchNotice).
  let followUpIntro: string | null = null;
  if (done && !noMatch) {
    if (!answerRetracted && answer.trim().endsWith("?")) followUpIntro = ANSWER_QUESTION;
    else if (candidates && !answerRetracted && answer === "" && solutions.length < 2) followUpIntro = MORE_DETAILS;
  }

  return (
    <section className="chat-results" aria-labelledby={RESULTS_HEADING_ID}>
      <h2 id={RESULTS_HEADING_ID} tabIndex={-1}>
        Wyniki
      </h2>

      {streaming && <StageProgress stage={state.stage} />}

      <p className="ds-sr-only" aria-live="polite" aria-atomic="true">
        {resultsAnnouncement(state)}
      </p>

      <div aria-live="polite">{error && <Alert tone="danger">{error.message_pl}</Alert>}</div>

      <div aria-live="polite">
        {answerRetracted && <p className="chat-results__note">{RETRACTED_NOTE}</p>}
      </div>

      {noMatch ? (
        <NoMatchNotice noMatch={noMatch} onFollowUp={done ? onFollowUp : null} />
      ) : (
        answer !== "" && <AnswerSummary answer={answer} cards={citable} busy={streaming} />
      )}

      {solutions.length > 0 && <CardList cards={solutions} label="Znalezione rozwiązania" />}

      {alsoSee.length > 0 && (
        <section className="chat-results__also ds-stack" aria-labelledby="zobacz-tez-naglowek">
          <h3 id="zobacz-tez-naglowek">Zobacz też</h3>
          <CardList cards={alsoSee} label="Zobacz też" />
        </section>
      )}

      <KnowledgeList items={context} />

      <div aria-live="polite">{saved && <ScaleNotice saved={saved} />}</div>

      {followUpIntro && <FollowUp onSubmit={onFollowUp} intro={followUpIntro} />}

      {done && searchEventId !== null && <FeedbackPrompt key={searchEventId} searchEventId={searchEventId} />}
    </section>
  );
}
