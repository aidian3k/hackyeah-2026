import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  back: { to: string; label: string };
  title: string;
  /** Linia pod tytułem: rodzaj, status, wyzwanie… */
  meta?: ReactNode;
  /** Oś czasu i elementy rozmowy. */
  children: ReactNode;
  /** Pasek na dole: pole wiadomości albo informacja, dlaczego nie można pisać. */
  footer?: ReactNode;
  /** Kolumna boczna (panel): na szerokim ekranie po prawej, na wąskim pod rozmową. */
  aside?: ReactNode;
  /** Komunikat dla czytnika ekranu (np. nowa wiadomość). */
  announcement?: string;
}

/** Układ ekranu rozmowy jak w komunikatorze: nagłówek, rozmowa, pole wiadomości przyklejone do dołu. */
export function ChatShell({ back, title, meta, children, footer, aside, announcement }: Props) {
  const chat = (
    <section aria-labelledby="chat-title" className="flex min-w-0 flex-col gap-4 lg:col-span-2">
      <header className="flex items-start gap-3 border-0 border-b border-solid border-line pb-3">
        <Link to={back.to} className="ds-btn ds-btn--link shrink-0 px-0" aria-label={`Wróć: ${back.label}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-6 w-6 fill-current">
            <path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z" />
          </svg>
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 id="chat-title" tabIndex={-1} className="m-0 text-h3 [overflow-wrap:anywhere]">
            {title}
          </h1>
          {meta && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">{meta}</div>
          )}
        </div>
      </header>
      <p className="ds-sr-only" aria-live="polite">
        {announcement}
      </p>
      {children}
      {footer}
    </section>
  );

  return (
    <div className={`mx-auto w-full px-4 pt-6 ${aside ? "max-w-6xl" : "max-w-3xl"}`}>
      {aside ? (
        <div className="grid gap-8 lg:grid-cols-3">
          {chat}
          <aside className="flex flex-col gap-6 pb-6 lg:sticky lg:top-6 lg:self-start">{aside}</aside>
        </div>
      ) : (
        chat
      )}
    </div>
  );
}
