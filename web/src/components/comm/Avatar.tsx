import type { ThreadMessage } from "@/api/comm";

const BASE =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-label leading-none select-none";

const TONES = {
  USER: "bg-soft-magenta text-ink",
  STAFF: "bg-navy text-navy-on",
  MENTOR: "bg-soft-green text-ink",
  ASSISTANT: "bg-soft-blue text-navy",
  SYSTEM: "bg-surface-muted text-ink-muted",
} as const;

function initials(msg: Pick<ThreadMessage, "role" | "mentor" | "author_label">): string {
  if (msg.role === "ASSISTANT") return "AI";
  if (msg.role === "STAFF") return "H";
  const name = msg.role === "MENTOR" ? msg.mentor?.display_name : msg.author_label;
  const words = (name ?? "").replace(/^(dr|prof\.?|mgr)\s+/i, "").trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || (msg.role === "MENTOR" ? "E" : "A");
}

/** Okrągły awatar nadawcy — tylko dekoracja; kto pisze, mówi podpis słowny obok. */
export function Avatar({ msg }: { msg: Pick<ThreadMessage, "role" | "mentor" | "author_label"> }) {
  return (
    <span aria-hidden="true" className={`${BASE} ${TONES[msg.role]}`}>
      {initials(msg)}
    </span>
  );
}
