// Moduł 7: Middleman innowacji — klient strumienia SSE rozmowy o wdrożeniu innowacji.
import { apiUrl } from "./base";
import { ApiError, errorFromResponse, networkError } from "./client";
import { parseFrames } from "./sse";
import type { ReporterType } from "./types";

export type AdaptRole = "user" | "assistant";
export interface AdaptMessage {
  role: AdaptRole;
  content: string;
}
export interface AdaptContext {
  reporter_type: ReporterType | null;
  gmina: string | null;
}
export interface AdaptChatRequest {
  messages: AdaptMessage[];
  context: AdaptContext;
}
export type AdaptErrorCode =
  | "ASSISTANT_UNAVAILABLE"
  | "LLM_UNAVAILABLE"
  | "LLM_TIMEOUT"
  | "INTERNAL"
  | "STREAM_CLOSED";
export type AdaptEvent =
  | { event: "token"; data: { text: string } }
  | { event: "error"; data: { code: AdaptErrorCode; message_pl: string } }
  | { event: "done"; data: { latency_ms: Record<string, number> } };

const ADAPT_EVENTS = new Set<string>(["token", "error", "done"]);

const STREAM_CLOSED: AdaptEvent = {
  event: "error",
  data: { code: "STREAM_CLOSED", message_pl: "Połączenie zostało przerwane. Spróbuj ponownie." },
};

function isAbort(e: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || (e instanceof DOMException && e.name === "AbortError");
}

/** Bufor SSE → zdarzenia M7 (parser M1 przepuszcza nazwy M1; tu zostawiamy tylko token/error/done). */
function parseAdaptFrames(buffer: string): { events: AdaptEvent[]; rest: string } {
  const { events, rest } = parseFrames(buffer);
  return {
    events: events.filter((e) => ADAPT_EVENTS.has(e.event)) as unknown as AdaptEvent[],
    rest,
  };
}

/**
 * POST /api/solutions/{id}/adapt-chat. Błędy HTTP i sieci → wyjątek `ApiError`.
 * Strumień zawsze kończy się `done` (przy zerwaniu: syntetyczne `error` STREAM_CLOSED + `done`).
 * Przerwanie przez `signal` kończy funkcję bez błędu i bez dalszych zdarzeń.
 */
export async function streamAdapt(
  solutionId: number,
  req: AdaptChatRequest,
  onEvent: (e: AdaptEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(apiUrl(`/api/solutions/${solutionId}/adapt-chat`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (isAbort(e, signal)) return;
    throw networkError();
  }

  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new ApiError(res.status, "BAD_RESPONSE", "Serwer zwrócił pustą odpowiedź. Spróbuj ponownie.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  const emit = (events: AdaptEvent[]) => {
    for (const ev of events) {
      if (sawDone) return;
      onEvent(ev);
      if (ev.event === "done") sawDone = true;
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const parsed = parseAdaptFrames(buffer + decoder.decode(value, { stream: true }));
      buffer = parsed.rest;
      emit(parsed.events);
      if (sawDone) {
        await reader.cancel().catch(() => undefined);
        return;
      }
    }
    // Ostatnia ramka bez końcowej pustej linii.
    emit(parseAdaptFrames(buffer + decoder.decode() + "\n\n").events);
  } catch (e) {
    if (isAbort(e, signal)) return;
    // zerwane połączenie — domykamy niżej syntetycznymi zdarzeniami
  }

  if (signal?.aborted) return;
  if (!sawDone) {
    onEvent(STREAM_CLOSED);
    onEvent({ event: "done", data: { latency_ms: {} } });
  }
}
