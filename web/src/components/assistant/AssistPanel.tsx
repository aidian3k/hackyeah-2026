import { useId, useRef, useState } from "react";
import { api, type ApiError } from "@/api/client";
import type { AssistResponse, AssistSuggestion, AssistTarget, CanvasBlockType } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { plural } from "@/lib/format";
import { ASSIST_PRIVACY_NOTE } from "@/lib/labels";

/** Nazwy pól fiszki, które asystent może zaproponować (`AssistSuggestion.field` przy target="idea"). */
export const IDEA_FIELD_LABELS: Record<string, string> = {
  title: "Tytuł pomysłu",
  summary: "Krótki opis",
  essence: "Na czym polega istota pomysłu",
  audience: "Dla kogo jest pomysł",
};

interface Props {
  ideaId: number;
  target: AssistTarget;
  /** Wymagany przy target="canvas_block". */
  blockId?: string;
  /** Typ bloku kanwy: `list` i `multi` dostają „Dodaj” (wpis w „inne”), pozostałe tylko tekst. */
  blockType?: CanvasBlockType;
  /**
   * Przyjęcie propozycji. Fiszka: wstaw `value` do pola `field` (bez automatycznego zapisu).
   * Kanwa (`list`/`multi`): dopisz `value` jako nowy wpis bloku.
   */
  onAccept: (suggestion: AssistSuggestion) => void;
  headingLevel?: 2 | 3;
}

interface Item extends AssistSuggestion {
  key: number;
}

function acceptLabel(target: AssistTarget, blockType?: CanvasBlockType): string | null {
  if (target === "idea") return "Wstaw";
  if (blockType === "list" || blockType === "multi") return "Dodaj";
  return null;
}

function summary(res: AssistResponse): string {
  if (!res.available) return "Asystent jest teraz niedostępny.";
  const n = res.suggestions.length;
  const q = res.questions.length;
  const parts: string[] = [];
  if (n > 0) parts.push(`zaproponował ${n} ${plural(n, "zmianę", "zmiany", "zmian")}`);
  if (q > 0) parts.push(`zadał ${q} ${plural(q, "pytanie", "pytania", "pytań")}`);
  return parts.length ? `Asystent ${parts.join(" i ")}.` : "Asystent nie ma teraz podpowiedzi.";
}

/** Podpowiedzi asystenta AI do fiszki pomysłu albo bloku kanwy (POST /api/ideas/{id}/assist). */
export function AssistPanel({ ideaId, target, blockId, blockType, onAccept, headingLevel = 3 }: Props) {
  const Heading = `h${headingLevel}` as const;
  const headingId = useId();
  const noteId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<AssistResponse | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const action = acceptLabel(target, blockType);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function ask() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setAnnouncement("");
    try {
      const res = await api.assist(ideaId, { target, block_id: target === "canvas_block" ? blockId : null });
      setResponse(res);
      setItems(res.suggestions.map((s, i) => ({ ...s, key: i })));
      setAnnouncement(summary(res));
    } catch (err) {
      setResponse(null);
      setItems([]);
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function dismiss(key: number) {
    setItems((list) => list.filter((x) => x.key !== key));
    // Karta znika — fokus wraca na przycisk asystenta, żeby nie zgubić miejsca.
    buttonRef.current?.focus();
  }

  function accept(item: Item) {
    const { key, ...suggestion } = item;
    // Najpierw usuwamy kartę (fokus na przycisk), potem wołamy rodzica — może przenieść fokus do pola.
    dismiss(key);
    onAccept(suggestion);
  }

  const fieldLabel = (field: string) => (target === "idea" ? (IDEA_FIELD_LABELS[field] ?? field) : null);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <Heading id={headingId} className="m-0 font-sans text-h3 text-navy">
        Podpowiedzi asystenta
      </Heading>
      <div className="flex flex-col gap-2">
        <div>
          <button
            ref={buttonRef}
            type="button"
            className="ds-btn"
            onClick={() => void ask()}
            aria-busy={loading}
            aria-disabled={loading}
            aria-describedby={noteId}
          >
            {loading ? "Asystent szuka podpowiedzi…" : "Poproś o podpowiedź"}
          </button>
        </div>
        <p id={noteId} className="m-0 text-small text-ink-muted">
          {ASSIST_PRIVACY_NOTE}
        </p>
      </div>

      {/* Ogłaszamy tylko podsumowanie, nie całą treść podpowiedzi. */}
      <p className="ds-sr-only" aria-live="polite">
        {announcement}
      </p>

      {error && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się pobrać podpowiedzi.">
            {error.message}
          </Alert>
        </div>
      )}

      {response && !response.available && (
        <Alert tone="info" title="Asystent jest teraz niedostępny.">
          {response.message_pl && <p>{response.message_pl}</p>}
          {response.questions.length > 0 && (
            <>
              <p>Zastanów się nad tymi pytaniami:</p>
              <ul>
                {response.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      )}

      {response?.available && (
        <div className="flex flex-col gap-3">
          {response.message_pl && <p className="m-0 text-body text-ink">{response.message_pl}</p>}
          {response.questions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="m-0 font-sans text-body font-bold text-ink">Pytania do przemyślenia</p>
              <ul className="m-0 flex flex-col gap-1 pl-6">
                {response.questions.map((q) => (
                  <li key={q} className="text-body text-ink">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {items.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Propozycje asystenta">
              {items.map((item) => {
                const label = fieldLabel(item.field);
                return (
                  <li key={item.key} className="ds-card flex flex-col gap-2">
                    {label && <p className="m-0 text-small text-ink-muted">Pole: {label}</p>}
                    <p className="m-0 whitespace-pre-line text-body text-ink [overflow-wrap:anywhere]">{item.value}</p>
                    {item.rationale && <p className="m-0 text-small text-ink-muted">{item.rationale}</p>}
                    <div className="flex flex-wrap gap-2">
                      {action && (
                        <button
                          type="button"
                          className="ds-btn ds-btn--small"
                          onClick={() => accept(item)}
                          aria-label={`${action}: ${item.value.slice(0, 60)}`}
                        >
                          {action}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ds-btn ds-btn--link ds-btn--small"
                        onClick={() => dismiss(item.key)}
                        aria-label={`Pomiń: ${item.value.slice(0, 60)}`}
                      >
                        Pomiń
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
