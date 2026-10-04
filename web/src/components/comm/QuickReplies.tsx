interface Reply {
  label: string;
  onClick(): void;
}

/** Szybkie odpowiedzi jak w komunikatorze — chipy po stronie użytkownika, nad polem wiadomości. */
export function QuickReplies({ replies, disabled = false }: { replies: Reply[]; disabled?: boolean }) {
  return (
    <div role="group" aria-label="Szybkie odpowiedzi" className="flex flex-wrap justify-end gap-2">
      {replies.map((r) => (
        <button key={r.label} type="button" className="ds-chip" disabled={disabled} onClick={r.onClick}>
          {r.label}
        </button>
      ))}
    </div>
  );
}
