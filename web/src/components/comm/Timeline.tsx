import { Fragment, type ReactNode } from "react";
import type { ThreadMessage } from "@/api/comm";
import { SolutionCard } from "@/components/SolutionCard";
import { messageRoleLabel, type Viewer } from "@/lib/comm";
import { formatDateTime } from "@/lib/format";

interface Props {
  messages: ThreadMessage[];
  viewer: Viewer;
}

const AI_NOTE = "Odpowiedź automatyczna (AI) — sprawdź szczegóły w kartach rozwiązań poniżej.";

function cardAnchor(messageId: number, n: number): string {
  return `karta-${messageId}-${n}`;
}

/** Treść jako zwykły tekst: akapity po pustej linii, a `[n]` (gdy jest karta n) jako link do karty. */
function MessageBody({ msg }: { msg: ThreadMessage }) {
  const paragraphs = msg.body.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, i) => {
        const parts: ReactNode[] = para.split(/(\[\d{1,2}\])/).map((part, j) => {
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
        });
        return (
          <p key={i} className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
            {parts}
          </p>
        );
      })}
    </>
  );
}

/** Oś czasu rozmowy: najpierw kto i kiedy (słownie), potem treść; pod odpowiedzią AI karty rozwiązań. */
export function Timeline({ messages, viewer }: Props) {
  return (
    <ol aria-label="Wiadomości" className="m-0 flex list-none flex-col gap-4 p-0">
      {messages.map((msg) => {
        const own = (viewer === "author" && msg.role === "USER") || (viewer === "staff" && msg.role === "STAFF");
        const ai = msg.role === "ASSISTANT";
        const system = msg.role === "SYSTEM";
        const tone = own
          ? "bg-surface-muted border-line"
          : ai
            ? "bg-soft-blue border-line-strong"
            : system
              ? "bg-surface border-line border-dashed"
              : "bg-surface border-line-strong";
        return (
          <li key={msg.id} className={`flex flex-col gap-3 rounded-md border p-4 ${tone}`}>
            <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small text-ink-muted">
              <strong className="text-label text-ink">{messageRoleLabel(msg, viewer)}</strong>
              {msg.author_label && msg.role === "USER" && (
                <span>
                  podpis: {msg.author_label} <span className="ds-sr-only">(niezweryfikowany)</span>
                </span>
              )}
              {msg.author_label && msg.role === "STAFF" && <span>{msg.author_label}</span>}
              <time dateTime={msg.created_at}>{formatDateTime(msg.created_at)}</time>
            </p>
            <MessageBody msg={msg} />
            {ai && <p className="m-0 text-small text-ink-muted">{AI_NOTE}</p>}
            {msg.cards.length > 0 && (
              <ul aria-label="Rozwiązania z Biblioteki Innowacji" className="m-0 flex list-none flex-col gap-3 p-0">
                {msg.cards.map((card, i) => (
                  <li key={card.id}>
                    <SolutionCard card={card} id={cardAnchor(msg.id, i + 1)} showRank headingLevel={3} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
