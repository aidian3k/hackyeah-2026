import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "danger";

interface Props {
  tone: AlertTone;
  /** Słowo na początku komunikatu; domyślne zależy od tonu. */
  title?: string;
  children?: ReactNode;
}

const DEFAULT_TITLES: Record<AlertTone, string> = {
  info: "Informacja:",
  success: "Gotowe:",
  warning: "Uwaga:",
  danger: "Błąd:",
};

// Ikony konturowe 2 px (styl obrysu z klasy ds-alert__icon).
const ICONS: Record<AlertTone, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="12" y1="7" x2="12.01" y2="7" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  danger: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
};

/** Komunikat: zawsze ikona + słowo (np. „Uwaga:”), kolor nie jest jedyną informacją. */
export function Alert({ tone, title, children }: Props) {
  const heading = title ?? DEFAULT_TITLES[tone];
  const inline = typeof children === "string" || typeof children === "number";
  return (
    <div className={`ds-alert ds-alert--${tone}`}>
      <svg className="ds-alert__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {ICONS[tone]}
      </svg>
      <div className="ds-alert__body">
        {inline ? (
          <p>
            <span className="ds-alert__title">{heading}</span> {children}
          </p>
        ) : (
          <>
            <p>
              <span className="ds-alert__title">{heading}</span>
            </p>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
