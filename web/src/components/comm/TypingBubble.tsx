import { Avatar } from "./Avatar";

/** Dymek „pisze…” asystenta z animowanymi kropkami (bez animacji przy prefers-reduced-motion). */
export function TypingBubble({ label = "Asystent szuka odpowiedzi w Bibliotece Innowacji…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-end gap-2">
      <Avatar msg={{ role: "ASSISTANT", mentor: null, author_label: null }} />
      <div className="flex flex-col gap-1">
        <p className="m-0 px-1 text-small text-ink-muted">{label}</p>
        <div className="flex w-fit items-center gap-1 rounded-lg rounded-bl-sm border border-solid border-line bg-soft-blue px-4 py-3">
          <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-navy motion-safe:animate-bounce" />
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-pill bg-navy motion-safe:animate-bounce [animation-delay:150ms]"
          />
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-pill bg-navy motion-safe:animate-bounce [animation-delay:300ms]"
          />
        </div>
      </div>
    </div>
  );
}
