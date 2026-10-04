// Moduł 7: Middleman innowacji — stan rozmowy o wdrożeniu innowacji (ADR-M7-002: historia tylko w pamięci).
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, networkError } from "@/api/client";
import {
  streamAdapt,
  type AdaptContext,
  type AdaptErrorCode,
  type AdaptEvent,
  type AdaptMessage,
} from "@/api/middleman";
import { MIDDLEMAN_MAX_MESSAGES } from "@/lib/middleman";

export interface AdaptChatState {
  messages: AdaptMessage[]; // tylko wysłane pytania i zakończone odpowiedzi
  pending: string | null; // odpowiedź w trakcie pisania (null = brak)
  streaming: boolean;
  error: { code: AdaptErrorCode; message_pl: string } | null;
  limitReached: boolean; // messages.length >= MIDDLEMAN_MAX_MESSAGES - 1
  lastAnswer: string | null; // ostatnia zakończona odpowiedź (do aria-live)
}

type CoreState = Omit<AdaptChatState, "limitReached">;

const INITIAL: CoreState = {
  messages: [],
  pending: null,
  streaming: false,
  error: null,
  lastAnswer: null,
};

/** `OTHER` = „Nie chcę podawać” → backend dostaje `null`; pusta gmina też `null`. */
function normalizeContext(context: AdaptContext): AdaptContext {
  return {
    reporter_type: context.reporter_type === "OTHER" ? null : context.reporter_type,
    gmina: context.gmina?.trim() || null,
  };
}

export function useAdaptChat(
  solutionId: number,
  context: AdaptContext,
): AdaptChatState & {
  send(text: string): Promise<void>;
  retry(): Promise<void>;
  reset(): void;
} {
  const [state, setState] = useState<CoreState>(INITIAL);
  // Aktualna historia bez czekania na render — podstawa kolejnego żądania.
  const messagesRef = useRef<AdaptMessage[]>([]);
  const contextRef = useRef(context);
  contextRef.current = context;
  const controllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const run = useCallback(
    async (history: AdaptMessage[]): Promise<void> => {
      stop();
      const controller = new AbortController();
      controllerRef.current = controller;
      messagesRef.current = history;
      setState((s) => ({ ...s, messages: history, pending: "", streaming: true, error: null }));

      let answer = "";
      let failed = false;
      const current = () => controllerRef.current === controller;

      const onEvent = (event: AdaptEvent) => {
        if (!current()) return; // strumień zastąpiony albo przerwany
        if (event.event === "token") {
          answer += event.data.text;
          setState((s) => ({ ...s, pending: answer }));
        } else if (event.event === "error") {
          failed = true;
          setState((s) => ({ ...s, pending: null, error: event.data }));
        } else if (event.event === "done") {
          controllerRef.current = null;
          if (failed) {
            setState((s) => ({ ...s, pending: null, streaming: false }));
            return;
          }
          const next: AdaptMessage[] = [...messagesRef.current, { role: "assistant", content: answer }];
          messagesRef.current = next;
          setState((s) => ({ ...s, messages: next, pending: null, streaming: false, lastAnswer: answer }));
        }
      };

      try {
        await streamAdapt(
          solutionId,
          { messages: history, context: normalizeContext(contextRef.current) },
          onEvent,
          controller.signal,
        );
      } catch (e: unknown) {
        if (controller.signal.aborted || !current()) return;
        controllerRef.current = null;
        const err = e instanceof ApiError ? e : networkError();
        setState((s) => ({
          ...s,
          pending: null,
          streaming: false,
          error: { code: "INTERNAL", message_pl: err.message },
        }));
      }
    },
    [solutionId, stop],
  );

  const send = useCallback(
    async (text: string): Promise<void> => {
      const content = text.trim();
      if (!content || messagesRef.current.length >= MIDDLEMAN_MAX_MESSAGES - 1) return;
      await run([...messagesRef.current, { role: "user", content }]);
    },
    [run],
  );

  const retry = useCallback(async (): Promise<void> => {
    const history = messagesRef.current;
    if (history.at(-1)?.role !== "user") return;
    await run(history);
  }, [run]);

  const reset = useCallback(() => {
    stop();
    messagesRef.current = [];
    setState(INITIAL);
  }, [stop]);

  // Odmontowanie albo zmiana innowacji → przerwij żądanie i zacznij od nowa.
  useEffect(() => {
    return () => {
      stop();
      messagesRef.current = [];
      setState(INITIAL);
    };
  }, [solutionId, stop]);

  return {
    ...state,
    limitReached: state.messages.length >= MIDDLEMAN_MAX_MESSAGES - 1,
    send,
    retry,
    reset,
  };
}
