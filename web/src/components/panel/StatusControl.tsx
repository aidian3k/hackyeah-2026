import { useRef, useState, type ReactNode } from "react";
import { ApiError, api } from "@/api/client";
import type { ReportDetail, ReportStatus } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { REPORT_STATUS_LABELS, REPORT_TRANSITIONS } from "@/lib/labels";

/** Etykiety przycisków przejść: mówią, co się stanie. */
const TRANSITION_LABELS: Record<ReportStatus, string> = {
  NEW: "Oznacz jako nowe",
  TRIAGED: "Oznacz jako przejrzane",
  MATCHED: "Oznacz jako dopasowane",
  IN_PROGRESS: "Rozpocznij działania",
  CLOSED: "Zamknij zgłoszenie",
};

// Ikony konturowe 2 px; informację niesie słowo obok.
const STATUS_ICONS: Record<ReportStatus, ReactNode> = {
  NEW: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  TRIAGED: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  MATCHED: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  IN_PROGRESS: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  CLOSED: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
    </>
  ),
};

/** Status zgłoszenia: ikona + słowo. */
export function StatusLabel({ status }: { status: ReportStatus }) {
  return (
    <span className="ds-cluster">
      <svg
        viewBox="0 0 24 24"
        width="1.25em"
        height="1.25em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {STATUS_ICONS[status]}
      </svg>
      <strong>{REPORT_STATUS_LABELS[status]}</strong>
    </span>
  );
}

interface Props {
  report: ReportDetail;
  /** Nowy stan zgłoszenia po udanej zmianie statusu. */
  onChange(updated: ReportDetail): void;
  /** Ponowne wczytanie zgłoszenia (np. po 409, gdy ktoś inny zmienił status). */
  onRefresh(): Promise<void>;
}

/** Obecny status słownie + przyciski tylko dla przejść dozwolonych przez backend. */
export function StatusControl({ report, onChange, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = `status-zgloszenia-${report.id}`;
  const next = REPORT_TRANSITIONS[report.status];

  async function change(status: ReportStatus) {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const updated = await api.patchReport(report.id, status);
      onChange(updated);
      setMessage(`Zmieniono status na „${REPORT_STATUS_LABELS[updated.status]}”.`);
    } catch (err) {
      const apiErr = toApiError(err);
      setError(apiErr);
      // 409: status zmienił się w międzyczasie albo przejście jest niedozwolone — pokaż aktualny stan.
      if (apiErr.status === 409) await onRefresh().catch(() => undefined);
    } finally {
      setBusy(false);
      // Kliknięty przycisk mógł zniknąć — fokus na nagłówek sekcji, żeby nie wypadł na początek strony.
      headingRef.current?.focus();
    }
  }

  return (
    <section className="ds-stack" aria-labelledby={headingId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        Status
      </h2>
      <div className="ds-cluster">
        <span>Obecny status:</span>
        <StatusLabel status={report.status} />
      </div>
      {next.length > 0 ? (
        <div className="ds-cluster" role="group" aria-label="Zmień status zgłoszenia">
          {next.map((s) => (
            <button key={s} type="button" className="ds-btn" disabled={busy} onClick={() => void change(s)}>
              {TRANSITION_LABELS[s]}
            </button>
          ))}
        </div>
      ) : (
        <p>Zgłoszenie jest zamknięte. Status nie może się już zmienić.</p>
      )}
      <div aria-live="polite">{message && <Alert tone="success">{message}</Alert>}</div>
      {error && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się zmienić statusu.">
            <p>{error.message}</p>
            {error.status === 409 && <p>Pokazujemy aktualny status zgłoszenia.</p>}
          </Alert>
        </div>
      )}
    </section>
  );
}
