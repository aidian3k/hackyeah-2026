import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiError, networkError } from "@/api/client";
import { streamChat } from "@/api/sse";
import type { ChatEvent, ChatRequest } from "@/api/types";
import { chatReducer, initialChatState, type ChatState } from "@/lib/chatReducer";
import { addMyReport, getSessionId, removeMyReport } from "@/lib/storage";

export function useChat(): {
  state: ChatState;
  send(input: Omit<ChatRequest, "session_id">): void;
  followUp(text: string): void;
  abort(): void;
  reset(): void;
} {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const controllerRef = useRef<AbortController | null>(null);
  // Ostatnio wysłane żądanie (z session_id) — podstawa dla followUp, bez zależności od renderu.
  const lastRequestRef = useRef<ChatRequest | null>(null);
  // report_id zapisany w bieżącej rozmowie — po followUp nowy wpis go zastępuje.
  const lastReportIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const start = useCallback(
    (request: ChatRequest, replaceReportId: number | null) => {
      stop();
      const controller = new AbortController();
      controllerRef.current = controller;
      lastRequestRef.current = request;
      dispatch({ type: "submit", request });

      const onEvent = (event: ChatEvent) => {
        if (controllerRef.current !== controller) return; // strumień już zastąpiony lub przerwany
        if (event.event === "report_saved") {
          if (replaceReportId !== null && replaceReportId !== event.data.report_id) {
            removeMyReport(replaceReportId);
          }
          addMyReport({
            report_id: event.data.report_id,
            created_at: new Date().toISOString(),
            excerpt: request.message,
            gmina: request.gmina ?? null,
          });
          lastReportIdRef.current = event.data.report_id;
        }
        dispatch({ type: "event", event });
        if (event.event === "done" && controllerRef.current === controller) controllerRef.current = null;
      };

      streamChat(request, onEvent, controller.signal).catch((e: unknown) => {
        if (controller.signal.aborted || controllerRef.current !== controller) return;
        controllerRef.current = null;
        dispatch({ type: "request_error", error: e instanceof ApiError ? e : networkError() });
      });
    },
    [stop],
  );

  const send = useCallback(
    (input: Omit<ChatRequest, "session_id">) => {
      lastReportIdRef.current = null; // nowa rozmowa — nowy wpis w „Moich zgłoszeniach”
      start({ ...input, session_id: getSessionId() }, null);
    },
    [start],
  );

  const followUp = useCallback(
    (text: string) => {
      const prev = lastRequestRef.current;
      const extra = text.trim();
      if (!prev || !extra) return;
      start({ ...prev, message: `${prev.message}\n\n${extra}` }, lastReportIdRef.current);
    },
    [start],
  );

  const abort = useCallback(() => {
    // Przerwanie nie anuluje zapisu zgłoszenia w backendzie; UI wraca do stanu początkowego.
    stop();
    dispatch({ type: "reset" });
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    lastRequestRef.current = null;
    lastReportIdRef.current = null;
    dispatch({ type: "reset" });
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { state, send, followUp, abort, reset };
}
