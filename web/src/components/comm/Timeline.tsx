import { Fragment, useEffect, useRef, type ReactNode } from "react";
import type { ThreadMessage } from "@/api/comm";
import { SolutionCard } from "@/components/SolutionCard";
import { chatTime, messageRoleLabel, type Viewer } from "@/lib/comm";
import { formatDateTime } from "@/lib/format";
import { Avatar } from "./Avatar";

interface Props {
  messages: ThreadMessage[];
  viewer: Viewer;
  /** Dodatkowe elementy na końcu listy (np. „pisze…”) — też przewijane do widoku. */
  after?: ReactNode;
  /** Zmiana tej wartości (np. statusu) też przewija na dół — obok nowej wiadomości. */
  scrollKey?: string;
}

const AI_NOTE = "Odpowiedź automatyczna (AI) — sprawdź szczegóły w kartach rozwiązań.";

function cardAnchor(messageId: number, n: number): string {
  return `karta-${messageId}-${n}`;
}

/** Czyja wiadomość jest „moja” (po prawej) z perspektywy oglądającego. */
function isOwn(msg: ThreadMessage, viewer: Viewer): boolean {
  if (viewer === "author") return msg.role === "USER";
  if (viewer === "staff") return msg.role === "STAFF";
  return msg.role === "MENTOR";
}

/** Treść jako zwykły tekst: akapity po pustej linii, a `[n]` (gdy jest karta n) jako link do karty. */
function MessageBody({ msg }: { msg: ThreadMessage }) {
  return (
    <>
      {msg.body.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
          {para.split(/(\[\d{1,2}\])/).map((part, j) => {
            const m = /^\[(\d{1,2})\]$/.exec(part);
            const n = m ? Number(m[1]) : 0;
            const card = m ? msg.cards[n - 1] : undefined;
            if (card) {
              return (
                <a key={j} href={`#${cardAnchor(msg.id, n)}`} aria-label={`źródło ${n}: ${card.title}`}>
                  [{n}]
                </a>
              );
            }
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}

function Bubble({ msg, viewer }: { msg: ThreadMessage; viewer: Viewer }) {
  const own = isOwn(msg, viewer);
  const ai = msg.role === "ASSISTANT";
  const label = messageRoleLabel(msg, viewer);
  const signature =
    msg.author_label && msg.author_label !== label && msg.role !== "ASSISTANT" ? msg.author_label : null;
  const bubble = own
    ? "rounded-lg rounded-br-sm bg-navy text-navy-on"
    : ai
      ? "rounded-lg rounded-bl-sm border border-solid border-line bg-soft-blue text-ink"
      : "rounded-lg rounded-bl-sm bg-surface-muted text-ink";

  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && <Avatar msg={msg} />}
      <div className={`flex min-w-0 max-w-2xl flex-col gap-1 ${own ? "items-end" : "items-start"}`}>
        <p className={`m-0 px-1 text-small text-ink-muted ${own ? "ds-sr-only" : ""}`}>
          <strong className="text-ink">{label}</strong>
          {signature && (
            <>
              {" · "}
              {signature}
              {msg.role === "USER" && <span className="ds-sr-only"> (podpis niezweryfikowany)</span>}
            </>
          )}
        </p>
        <div className={`flex flex-col gap-2 px-4 py-2 ${bubble}`}>
          <MessageBody msg={msg} />
          {ai && <p className="m-0 text-small">{AI_NOTE}</p>}
        </div>
        {msg.cards.length > 0 && (
          <ul aria-label="Rozwiązania z Biblioteki Innowacji" className="m-0 flex w-full list-none flex-col gap-3 p-0">
            {msg.cards.map((card, i) => (
              <li key={card.id}>
                <SolutionCard card={card} id={cardAnchor(msg.id, i + 1)} showRank headingLevel={3} />
              </li>
            ))}
          </ul>
        )}
        <p className="m-0 px-1 text-small text-ink-muted">
          <time dateTime={msg.created_at} title={formatDateTime(msg.created_at)}>
            {chatTime(msg.created_at)}
          </time>
        </p>
      </div>
    </div>
  );
}

/**
 * Rozmowa jak w komunikatorze: własne wiadomości po prawej, cudze po lewej z awatarem,
 * informacje systemowe na środku. Kto pisze — zawsze słownie (dla czytnika także przy własnych).
 * Po wczytaniu i przy każdej nowej wiadomości widok przewija się na dół rozmowy.
 */
export function Timeline({ messages, viewer, after, scrollKey }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count, scrollKey]);

  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Wiadomości" className="m-0 flex list-none flex-col gap-4 p-0">
        {messages.map((msg) =>
          msg.role === "SYSTEM" ? (
            <li key={msg.id} className="flex justify-center">
              <p className="m-0 max-w-xl rounded-pill bg-surface-muted px-4 py-1 text-center text-small text-ink-muted">
                <span className="ds-sr-only">Informacja: </span>
                {msg.body}
              </p>
            </li>
          ) : (
            <li key={msg.id}>
              <Bubble msg={msg} viewer={viewer} />
            </li>
          ),
        )}
      </ol>
      {after}
      <div ref={endRef} className="scroll-mb-32" />
    </div>
  );
}
