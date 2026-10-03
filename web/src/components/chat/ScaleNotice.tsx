import { Link } from "react-router-dom";
import type { ReportSavedEvent } from "@/api/types";
import { scaleMessage } from "@/lib/format";

interface Props {
  saved: ReportSavedEvent;
}

/**
 * Skala problemu i numer zgłoszenia. Znacznik ds-alert--info z własną ikoną osób
 * (komponent Alert ma stałe ikony tonów). Bez koloru accent.
 */
export function ScaleNotice({ saved }: Props) {
  return (
    <div className="ds-alert ds-alert--info scale-notice">
      <svg className="ds-alert__icon scale-notice__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      </svg>
      <div className="ds-alert__body">
        <p className="scale-notice__lead">
          <span className="ds-alert__title">Skala problemu:</span> {scaleMessage(saved)}
        </p>
        <p>
          Twoje zgłoszenie ma numer <strong>{saved.report_id}</strong>. Odpowiedź zespołu Hubu znajdziesz w zakładce{" "}
          <Link to="/moje-zgloszenia">Moje zgłoszenia</Link>.
        </p>
      </div>
    </div>
  );
}
