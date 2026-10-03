import type { NoMatchEvent } from "@/api/types";
import { Alert } from "@/components/Alert";
import { FollowUp } from "@/components/chat/FollowUp";

interface Props {
  noMatch: NoMatchEvent;
  /** null → bez pola doprecyzowania (np. strumień jeszcze trwa). */
  onFollowUp: ((text: string) => void) | null;
}

/** „Nie wiem” to normalna odpowiedź, nie błąd: ton info, nie danger. */
export function NoMatchNotice({ noMatch, onFollowUp }: Props) {
  return (
    <div className="no-match ds-stack">
      <Alert tone="info">{noMatch.message_pl}</Alert>
      {onFollowUp && (
        <FollowUp onSubmit={onFollowUp} intro="Dopisz więcej szczegółów: kogo dotyczy problem, gdzie, od kiedy." />
      )}
    </div>
  );
}
