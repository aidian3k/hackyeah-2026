/// <reference types="node" />
// Ręczny skrypt sprawdzający parser SSE (nie test).
//   npx tsx web/scripts/check-sse.ts                              # pliki docs/mocks/chat-*.sse, kawałki po 7 znaków
//   npx tsx web/scripts/check-sse.ts --live http://localhost:8001  # to samo przez fetch na mocku
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrames } from "../src/api/sse.ts";
import type { ChatEvent } from "../src/api/types.ts";

const MOCKS = join(dirname(fileURLToPath(import.meta.url)), "../../docs/mocks");
const CHUNK = 7;

function summarize(events: ChatEvent[]): string {
  const names: string[] = [];
  for (const e of events) {
    const name = e.event === "token" ? "token…" : e.event;
    if (name === "token…" && names[names.length - 1] === "token…") continue;
    names.push(name);
  }
  return names.join(" ");
}

function parseInChunks(text: string): ChatEvent[] {
  const events: ChatEvent[] = [];
  let buffer = "";
  for (let i = 0; i < text.length; i += CHUNK) {
    const parsed = parseFrames(buffer + text.slice(i, i + CHUNK));
    events.push(...parsed.events);
    buffer = parsed.rest;
  }
  events.push(...parseFrames(buffer + "\n\n").events);
  return events;
}

async function parseLive(base: string, scenario: string): Promise<ChatEvent[]> {
  const res = await fetch(`${base}/api/chat?scenario=${scenario}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ message: "Starsi ludzie są samotni" }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const events: ChatEvent[] = [];
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = parseFrames(buffer + decoder.decode(value, { stream: true }));
    events.push(...parsed.events);
    buffer = parsed.rest;
  }
  events.push(...parseFrames(buffer + decoder.decode() + "\n\n").events);
  return events;
}

const liveIdx = process.argv.indexOf("--live");
const live = liveIdx === -1 ? null : (process.argv[liveIdx + 1] ?? "http://localhost:8001").replace(/\/$/, "");
const files = readdirSync(MOCKS)
  .filter((f) => /^chat-.+\.sse$/.test(f))
  .sort();

for (const file of files) {
  const scenario = file.replace(/^chat-/, "").replace(/\.sse$/, "");
  const events = live
    ? await parseLive(live, scenario)
    : parseInChunks(readFileSync(join(MOCKS, file), "utf-8"));
  const label = live ? `${scenario} (live)` : file.replace(/\.sse$/, "");
  console.log(`${label}: ${summarize(events)}  [${events.length} zdarzeń]`);
}
