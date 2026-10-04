// Moduł 7: Middleman innowacji — rozmowa z asystentem wdrożenia (układ dymków jak comm/Timeline z M5).
import { useEffect, useRef, type ReactNode } from "react";
import type { AdaptMessage } from "@/api/middleman";
import { Avatar } from "@/components/comm/Avatar";
import { TypingBubble } from "@/components/comm/TypingBubble";

interface Props {
  /** Powitanie asystenta — tylko na ekranie, nie trafia do historii wysyłanej do backendu. */
  greeting: string;
  messages: AdaptMessage[];
  /** Odpowiedź w trakcie pisania (null = brak, "" = przed pierwszym tokenem). */
  pending: string | null;
  streaming: boolean;
}

const AI_CAPTION = "Propozycja AI — sprawdź przed wdrożeniem";

const ROLE_LABELS = { user: "Ty", assistant: "Asystent AI" } as const;

/** Usuwa znaczniki pogrubienia Markdown — treść pokazujemy jako zwykły tekst. */
function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

/** Akapit: zwykłe linie jako tekst, kolejne linie zaczynające się od „- ” jako lista. */
function Paragraph({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let lines: string[] = [];
  let items: string[] = [];

  const flushLines = () => {
    if (lines.length === 0) return;
    blocks.push(
      <p key={blocks.length} className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
        {lines.join("\n")}
      </p>,
    );
    lines = [];
  };
  const flushItems = () => {
    if (items.length === 0) return;
    blocks.push(
      <ul key={blocks.length} className="m-0 flex flex-col gap-1 pl-6">
        {items.map((item, i) => (
          <li key={i} className="[overflow-wrap:anywhere]">
            {item}
          </li>
        ))}
      </ul>,
    );
    items = [];
  };

  for (const line of text.split("\n")) {
    const m = /^\s*-\s+(.*)$/.exec(line);
    if (m) {
      flushLines();
      items.push(m[1] ?? "");
    } else {
      flushItems();
      lines.push(line);
    }
  }
  flushLines();
  flushItems();
  return <>{blocks}</>;
}

/** Treść jako zwykły tekst (bez HTML): akapity po pustej linii, linie „- ” jako lista. */
function MessageBody({ text }: { text: string }) {
  return (
    <>
      {plain(text)
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => (
          <Paragraph key={i} text={para} />
        ))}
    </>
  );
}

function Bubble({ from, text, caption }: { from: AdaptMessage["role"]; text: string; caption: boolean }) {
  const own = from === "user";
  const bubble = own
    ? "rounded-lg rounded-br-sm bg-navy text-navy-on"
    : "rounded-lg rounded-bl-sm border border-solid border-line bg-soft-blue text-ink";

  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && <Avatar msg={{ role: "ASSISTANT", mentor: null, author_label: null }} />}
      <div className={`flex min-w-0 max-w-2xl flex-col gap-1 ${own ? "items-end" : "items-start"}`}>
        <p className={`m-0 px-1 text-small text-ink-muted ${own ? "ds-sr-only" : ""}`}>
          <strong className="text-ink">{ROLE_LABELS[from]}</strong>
        </p>
        <div className={`flex flex-col gap-2 px-4 py-2 ${bubble}`}>
          <MessageBody text={text} />
        </div>
        {caption && <p className="m-0 px-1 text-small text-ink-muted">{AI_CAPTION}</p>}
      </div>
    </div>
  );
}

/**
 * Rozmowa jak w komunikatorze: pytania „Ty” po prawej, odpowiedzi asystenta po lewej z awatarem.
 * Kto pisze — zawsze słownie (dla czytnika także przy własnych). Odpowiedź w trakcie rośnie
 * w dymku asystenta; przed pierwszym tokenem — „pisze…”. Nowa wiadomość przewija widok na dół.
 */
export function AdaptTimeline({ greeting, messages, pending, streaming }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.length;
  const phase = !streaming ? "idle" : pending ? "answer" : "typing";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count, phase]);

  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Wiadomości" className="m-0 flex list-none flex-col gap-4 p-0">
        <li>
          <Bubble from="assistant" text={greeting} caption={false} />
        </li>
        {messages.map((msg, i) => (
          <li key={i}>
            <Bubble from={msg.role} text={msg.content} caption={msg.role === "assistant"} />
          </li>
        ))}
        {streaming && pending && (
          <li aria-busy="true">
            <Bubble from="assistant" text={pending} caption={false} />
          </li>
        )}
      </ol>
      {streaming && !pending && <TypingBubble label="Asystent pisze odpowiedź…" />}
      <div ref={endRef} className="scroll-mb-32" />
    </div>
  );
}
