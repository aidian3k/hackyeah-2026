import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { api, type ApiError } from "@/api/client";
import type { SolutionDetail, SolutionPatch } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { refreshInbox } from "@/hooks/useInboxCount";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { EVIDENCE_LABELS } from "@/lib/labels";

interface Props {
  solution: SolutionDetail;
  /** Wywoływane z odpowiedzią PATCH (nowa kategoria, poziom sprawdzenia). */
  onUpdated(solution: SolutionDetail): void;
}

type StatusAction = NonNullable<SolutionPatch["status"]>;

const STATUS_SUCCESS: Record<StatusAction, string> = {
  PUBLISHED: "Opublikowano. Rozwiązanie jest już widoczne w wyszukiwaniu.",
  REJECTED: "Odrzucono. Pomysł nie trafi do biblioteki.",
  ARCHIVED: "Przeniesiono do archiwum. Rozwiązanie nie jest już widoczne w wyszukiwaniu.",
};

const EVIDENCE_LEVELS = [1, 2, 3, 4, 5];

/**
 * Działania pracownika Hubu na rozwiązaniu: korekta kategorii i poziomu sprawdzenia
 * oraz zmiana statusu. API nie zwraca obecnego statusu, więc trzy działania są zawsze te same.
 */
export function ReviewActions({ solution, onUpdated }: Props) {
  const uid = useId();
  const { items: taxonomy, error: taxonomyError } = useTaxonomy();
  const [category, setCategory] = useState(solution.category ?? "");
  const [evidence, setEvidence] = useState(solution.evidence_level);
  const [busy, setBusy] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [success, setSuccess] = useState<{ tone: "success" | "info"; text: string; status: StatusAction | null } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Potwierdzenie w miejscu: fokus na „Tak, odrzuć”, po anulowaniu z powrotem na „Odrzuć”.
  useEffect(() => {
    if (confirmReject) confirmRef.current?.focus();
    else if (wasConfirming.current) rejectRef.current?.focus();
    wasConfirming.current = confirmReject;
  }, [confirmReject]);

  const categoryChanged = category !== (solution.category ?? "") && category !== "";
  const evidenceChanged = evidence !== solution.evidence_level;
  const categoryKnown = solution.category === null || taxonomy.some((t) => t.code === solution.category);

  async function run(patch: SolutionPatch, text: string, status: StatusAction | null) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patchSolution(solution.id, patch);
      onUpdated(updated);
      // Licznik „Nowe” w nawigacji (pending_solutions) od razu, nie po 30 s.
      if (patch.status) void refreshInbox();
      setCategory(updated.category ?? "");
      setEvidence(updated.evidence_level);
      setSuccess({ tone: "success", text, status });
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
      setConfirmReject(false);
    }
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!categoryChanged && !evidenceChanged) {
      setError(null);
      setSuccess({ tone: "info", text: "Nie ma zmian do zapisania.", status: null });
      return;
    }
    const patch: SolutionPatch = {};
    if (categoryChanged) patch.category = category;
    if (evidenceChanged) patch.evidence_level = evidence;
    void run(patch, "Zapisano zmiany. Karta rozwiązania pokazuje nową kategorię i poziom sprawdzenia.", null);
  }

  function cancelOnEscape(e: KeyboardEvent) {
    if (e.key === "Escape") setConfirmReject(false);
  }

  function setStatus(status: StatusAction) {
    void run({ status }, STATUS_SUCCESS[status], status);
  }

  return (
    <div className="ds-stack">
      <form className="ds-stack" onSubmit={save} aria-labelledby={`${uid}-edit`} noValidate>
        <h3 id={`${uid}-edit`}>Kategoria i poziom sprawdzenia</h3>
        <div className="ds-field">
          <label className="ds-label" htmlFor={`${uid}-category`}>
            Kategoria
          </label>
          <select
            id={`${uid}-category`}
            className="ds-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-describedby={taxonomyError ? `${uid}-category-error` : undefined}
            disabled={busy}
          >
            {solution.category === null && <option value="">Bez kategorii</option>}
            {!categoryKnown && solution.category && (
              <option value={solution.category}>{solution.category_label_pl ?? solution.category}</option>
            )}
            {taxonomy.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
          </select>
          {taxonomyError && (
            <p id={`${uid}-category-error`} className="ds-hint">
              Nie udało się wczytać listy kategorii. Odśwież stronę, żeby ją zmienić.
            </p>
          )}
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor={`${uid}-evidence`}>
            Poziom sprawdzenia
          </label>
          <select
            id={`${uid}-evidence`}
            className="ds-select"
            value={evidence}
            onChange={(e) => setEvidence(Number(e.target.value))}
            aria-describedby={`${uid}-evidence-hint`}
            disabled={busy}
          >
            {EVIDENCE_LEVELS.map((n) => (
              <option key={n} value={n}>
                {n} z 5 — {EVIDENCE_LABELS[n]}
              </option>
            ))}
          </select>
          <p id={`${uid}-evidence-hint`} className="ds-hint">
            Nowe pomysły mają poziom 1. Podnieś go, jeśli wiesz, że rozwiązanie zostało wdrożone.
          </p>
        </div>
        <div className="ds-cluster">
          <button type="submit" className="ds-btn" disabled={busy}>
            Zapisz zmiany
          </button>
        </div>
      </form>

      <section className="ds-stack" aria-labelledby={`${uid}-status`}>
        <h3 id={`${uid}-status`}>Decyzja</h3>
        <p className="ds-hint">
          Zmiana działa od razu: opublikowane rozwiązanie jest w bibliotece i w wynikach wyszukiwania.
        </p>
        {confirmReject ? (
          <div
            className="ds-stack"
            role="group"
            aria-labelledby={`${uid}-confirm`}
          >
            <p id={`${uid}-confirm`}>
              <strong>Na pewno odrzucić? Pomysł nie trafi do biblioteki.</strong>
            </p>
            <div className="ds-cluster">
              <button
                ref={confirmRef}
                type="button"
                className="ds-btn ds-btn--primary"
                disabled={busy}
                onKeyDown={cancelOnEscape}
                onClick={() => setStatus("REJECTED")}
              >
                Tak, odrzuć
              </button>
              <button
                type="button"
                className="ds-btn"
                disabled={busy}
                onKeyDown={cancelOnEscape}
                onClick={() => setConfirmReject(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <div className="ds-cluster">
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              disabled={busy}
              onClick={() => setStatus("PUBLISHED")}
            >
              Opublikuj w bibliotece
            </button>
            <button
              ref={rejectRef}
              type="button"
              className="ds-btn"
              disabled={busy}
              onClick={() => {
                setSuccess(null);
                setConfirmReject(true);
              }}
            >
              Odrzuć
            </button>
            <button type="button" className="ds-btn" disabled={busy} onClick={() => setStatus("ARCHIVED")}>
              Przenieś do archiwum
            </button>
          </div>
        )}
      </section>

      <div aria-live="polite">
        {busy && <p>Zapisujemy…</p>}
        {success && (
          <Alert tone={success.tone}>
            <p>{success.text}</p>
            {success.status && (
              <p>
                <Link to="/panel/rozwiazania">Wróć do kolejki</Link>
              </p>
            )}
          </Alert>
        )}
      </div>
      {error && (
        <div role="alert">
          <Alert tone="danger" title="Nie udało się zapisać.">
            <p>{error.message}</p>
          </Alert>
        </div>
      )}
    </div>
  );
}
