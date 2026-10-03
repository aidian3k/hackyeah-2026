import { ApiError, errorFromResponse, networkError } from "./client";
import type { ChatEvent, ChatRequest } from "./types";

const KNOWN_EVENTS = new Set<ChatEvent["event"]>([
  "status",
  "candidates",
  "token",
  "answer_retracted",
  "no_match",
  "report_saved",
  "done",
  "error",
]);

const STREAM_CLOSED: ChatEvent = {
  event: "error",
  data: { code: "STREAM_CLOSED", message_pl: "Połączenie zostało przerwane. Spróbuj ponownie." },
};

/** Jedna ramka SSE (bez separatora `\n\n`) → zdarzenie albo null (nieznane / puste / zły JSON). */
function parseFrame(frame: string): ChatEvent | null {
  let name = "message";
  const data: string[] = [];
  for (const rawLine of frame.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") name = value;
    else if (field === "data") data.push(value);
  }
  if (!KNOWN_EVENTS.has(name as ChatEvent["event"]) || data.length === 0) return null;
  try {
    return { event: name, data: JSON.parse(data.join("\n")) } as ChatEvent;
  } catch {
    return null;
  }
}

/**
 * Wyciąga z bufora wszystkie kompletne ramki (rozdzielone pustą linią).
 * `rest` to niedokończona końcówka — doklej do niej następny kawałek strumienia.
 */
export function parseFrames(buffer: string): { events: ChatEvent[]; rest: string } {
  const normalized = buffer.replace(/\r\n?/g, "\n");
  const events: ChatEvent[] = [];
  let start = 0;
  let sep = normalized.indexOf("\n\n", start);
  while (sep !== -1) {
    const ev = parseFrame(normalized.slice(start, sep));
    if (ev) events.push(ev);
    start = sep + 2;
    sep = normalized.indexOf("\n\n", start);
  }
  return { events, rest: normalized.slice(start) };
}

function chatUrl(): string {
  if (import.meta.env?.DEV && typeof location !== "undefined") {
    const scenario = new URLSearchParams(location.search).get("scenario");
    if (scenario) return `/api/chat?scenario=${encodeURIComponent(scenario)}`;
  }
  return "/api/chat";
}

function isAbort(e: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || (e instanceof DOMException && e.name === "AbortError");
}

export async function streamChat(
  req: ChatRequest,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(chatUrl(), {
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

  const emit = (events: ChatEvent[]) => {
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
      const parsed = parseFrames(buffer + decoder.decode(value, { stream: true }));
      buffer = parsed.rest;
      emit(parsed.events);
      if (sawDone) {
        await reader.cancel().catch(() => undefined);
        return;
      }
    }
    // Ostatnia ramka bez końcowej pustej linii.
    emit(parseFrames(buffer + decoder.decode() + "\n\n").events);
  } catch (e) {
    if (isAbort(e, signal)) return;
    // zerwane połączenie — domykamy niżej syntetycznymi zdarzeniami
  }

  if (signal?.aborted) return;
  if (!sawDone) {
    onEvent(STREAM_CLOSED);
    onEvent({ event: "done", data: { search_event_id: null, latency_ms: {} } });
  }
}
