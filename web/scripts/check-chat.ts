/// <reference types="node" />
// Ręczny skrypt sprawdzający reduktor czatu (nie test).
//   npx tsx web/scripts/check-chat.ts
// Dla każdego docs/mocks/chat-*.sse składa stan przez parseFrames + chatReducer i wypisuje podsumowanie.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrames } from "../src/api/sse.ts";
import { chatReducer, initialChatState, type ChatState } from "../src/lib/chatReducer.ts";

const MOCKS = join(dirname(fileURLToPath(import.meta.url)), "../../docs/mocks");

function replay(text: string): ChatState {
  let state = chatReducer(initialChatState, {
    type: "submit",
    request: { message: "Starsi ludzie są samotni", session_id: "check", reporter_type: "OTHER" },
  });
  for (const event of parseFrames(text + "\n\n").events) {
    state = chatReducer(state, { type: "event", event });
  }
  return state;
}

function summary(s: ChatState): string {
  const c = s.candidates;
  return [
    `phase=${s.phase}`,
    `karty=${c ? c.solutions.length : "brak"}`,
    `also_see=${c ? c.also_see.length : "-"}`,
    `context=${c ? c.context.length : "-"}`,
    `answer=${s.answer.length} zn.`,
    `answerRetracted=${s.answerRetracted}`,
    `noMatch=${s.noMatch ? s.noMatch.reason : "nie"}`,
    `saved=${s.saved ? `report_id ${s.saved.report_id}, similar_count ${s.saved.similar_count}, gmina_count ${s.saved.gmina_count}` : "nie"}`,
    `error=${s.error ? s.error.code : "nie"}`,
    `searchEventId=${s.searchEventId}`,
  ].join(" | ");
}

type Check = (s: ChatState) => string[];

const EXPECT: Record<string, Check> = {
  match: (s) => [
    s.candidates?.solutions.length === 3 ? "" : "oczekiwano 3 kart",
    s.answer.length > 0 ? "" : "oczekiwano niepustego answer",
    s.saved?.similar_count === 9 ? "" : "oczekiwano saved.similar_count = 9",
  ],
  "no-match": (s) => [
    (s.candidates?.solutions.length ?? 0) === 0 ? "" : "oczekiwano 0 kart",
    s.noMatch ? "" : "oczekiwano noMatch",
    (s.candidates?.context.length ?? 0) > 0 ? "" : "oczekiwano niepustego context",
  ],
  retracted: (s) => [
    s.answer === "" ? "" : "oczekiwano answer = \"\"",
    s.answerRetracted ? "" : "oczekiwano answerRetracted = true",
    (s.candidates?.solutions.length ?? 0) > 0 ? "" : "oczekiwano kart",
  ],
  error: (s) => [
    (s.candidates?.solutions.length ?? 0) > 0 ? "" : "oczekiwano kart",
    s.error?.code === "LLM_UNAVAILABLE" ? "" : "oczekiwano error.code = LLM_UNAVAILABLE",
    s.saved ? "" : "oczekiwano saved",
  ],
};

let failed = 0;
const files = readdirSync(MOCKS)
  .filter((f) => /^chat-.*\.sse$/.test(f))
  .sort();

for (const file of files) {
  const name = file.replace(/^chat-|\.sse$/g, "");
  const state = replay(readFileSync(join(MOCKS, file), "utf8"));
  const problems = [state.phase === "done" ? "" : "oczekiwano phase = done", ...(EXPECT[name]?.(state) ?? [])].filter(
    Boolean,
  );
  failed += problems.length ? 1 : 0;
  console.log(`${problems.length ? "BŁĄD" : "OK  "} ${name.padEnd(10)} ${summary(state)}`);
  for (const p of problems) console.log(`       - ${p}`);
}

// Zdarzenia po zakończeniu (np. spóźnione po przerwaniu) nie zmieniają stanu.
const after = chatReducer(initialChatState, { type: "event", event: { event: "token", data: { text: "x" } } });
if (after !== initialChatState) {
  failed++;
  console.log("BŁĄD zdarzenie w stanie idle zmieniło stan");
}

console.log(failed ? `\n${failed} scenariusz(y) niezgodne` : "\nWszystkie scenariusze zgodne");
process.exitCode = failed ? 1 : 0;
