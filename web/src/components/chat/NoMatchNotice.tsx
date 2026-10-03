import { Link } from "react-router-dom";
import type { NoMatchEvent } from "@/api/types";
import { Alert } from "@/components/Alert";
import { FollowUp } from "@/components/chat/FollowUp";

interface Props {
  noMatch: NoMatchEvent;
  /** null → bez pola doprecyzowania (np. strumień jeszcze trwa). */
  onFollowUp: ((text: string) => void) | null;
  /** Moduł 3: numer zapisanego zgłoszenia — link do fiszki pomysłu z opisem z tego zgłoszenia. */
  reportId?: number | null;
}

/** „Nie wiem” to normalna odpowiedź, nie błąd: ton info, nie danger. */
export function NoMatchNotice({ noMatch, onFollowUp, reportId = null }: Props) {
  return (
    <div className="no-match ds-stack">
      <Alert tone="info">{noMatch.message_pl}</Alert>
      {onFollowUp && (
        <FollowUp onSubmit={onFollowUp} intro="Dopisz więcej szczegółów: kogo dotyczy problem, gdzie, od kiedy." />
      )}
      {/* Moduł 3: w URL tylko numer zgłoszenia, treść fiszka pobiera z API. */}
      {reportId !== null && (
        <p className="m-0">
          <Link className="ds-btn" to={`/mam-pomysl?zgloszenie=${reportId}`}>
            Masz pomysł, jak to rozwiązać? Opisz go
          </Link>
        </p>
      )}
    </div>
  );
}
