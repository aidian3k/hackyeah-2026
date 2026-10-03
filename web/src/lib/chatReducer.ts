// Stan czatu jako czysta funkcja (bez efektów ubocznych).
// Kolejność zdarzeń: status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done.
// `error` może przyjść wszędzie, po nim zawsze `done`. Wskaźnik ładowania zamyka tylko `done`.
import type { ApiError } from "@/api/client";
import type {
  CandidatesEvent,
  ChatEvent,
  ChatRequest,
  ErrorEvent,
  NoMatchEvent,
  ReportSavedEvent,
  StatusEvent,
} from "@/api/types";

export type ChatPhase = "idle" | "streaming" | "done";

export interface ChatState {
  phase: ChatPhase;
  request: ChatRequest | null; // ostatnio wysłane (do pytania doprecyzowującego)
  stage: StatusEvent | null; // ostatni status
  candidates: CandidatesEvent | null;
  answer: string; // sklejone tokeny
  answerRetracted: boolean;
  noMatch: NoMatchEvent | null;
  saved: ReportSavedEvent | null; // brak = zapis nieudany → bez licznika i bez numeru
  error: ErrorEvent | null; // błąd w strumieniu (karty mogą już być)
  requestError: ApiError | null; // błąd przed strumieniem (422, sieć)
  searchEventId: number | null;
}

export type ChatAction =
  | { type: "submit"; request: ChatRequest }
  | { type: "event"; event: ChatEvent }
  | { type: "request_error"; error: ApiError }
  | { type: "reset" };

export const initialChatState: ChatState = {
  phase: "idle",
  request: null,
  stage: null,
  candidates: null,
  answer: "",
  answerRetracted: false,
  noMatch: null,
  saved: null,
  error: null,
  requestError: null,
  searchEventId: null,
};

function applyEvent(state: ChatState, event: ChatEvent): ChatState {
  switch (event.event) {
    case "status":
      return { ...state, stage: event.data };
    case "candidates":
      return { ...state, candidates: event.data };
    case "token":
      // Po wycofaniu odpowiedzi nie sklejamy dalszych tokenów.
      return state.answerRetracted ? state : { ...state, answer: state.answer + event.data.text };
    case "answer_retracted":
      return { ...state, answer: "", answerRetracted: true };
    case "no_match":
      return { ...state, noMatch: event.data };
    case "report_saved":
      return { ...state, saved: event.data };
    case "error":
      return { ...state, error: event.data };
    case "done":
      return { ...state, phase: "done", searchEventId: event.data.search_event_id };
    default:
      return state;
  }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "submit":
      return { ...initialChatState, phase: "streaming", request: action.request };
    case "event":
      // Zdarzenia spoza trwającego strumienia (np. spóźnione po przerwaniu) ignorujemy.
      return state.phase === "streaming" ? applyEvent(state, action.event) : state;
    case "request_error":
      // Strumień się nie zaczął: wracamy do formularza, `request` zostaje do ponowienia.
      return { ...state, phase: "idle", requestError: action.error };
    case "reset":
      return initialChatState;
    default:
      return state;
  }
}
