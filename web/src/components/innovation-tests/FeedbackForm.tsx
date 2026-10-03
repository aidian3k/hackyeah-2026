import { useId, useState, type FormEvent } from "react";
import { api, ApiError } from "@/api/client";
import type { InnovationTestFeedback } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { RATING_SCALE_LABELS } from "@/lib/labels";

interface Props {
  token: string;
  onSubmitted: (feedback: InnovationTestFeedback) => void;
}

type RatingKey = "usefulness" | "ease_of_use" | "accessibility" | "fit_to_needs";

const FIELDS: { key: RatingKey; label: string }[] = [
  { key: "usefulness", label: "Przydatność" },
  { key: "ease_of_use", label: "Łatwość użycia" },
  { key: "accessibility", label: "Dostępność" },
  { key: "fit_to_needs", label: "Dopasowanie do potrzeb" },
];

export function FeedbackForm({ token, onSubmitted }: Props) {
  const formId = useId();
  const [ratings, setRatings] = useState<Record<RatingKey, number | null>>({
    usefulness: null,
    ease_of_use: null,
    accessibility: null,
    fit_to_needs: null,
  });
  const [comment, setComment] = useState("");
  const [improvement, setImprovement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    for (const field of FIELDS) {
      if (!ratings[field.key]) {
        setError(new ApiError(422, "VALIDATION_ERROR", `Wybierz ocenę: ${field.label}.`));
        return;
      }
    }
    setSubmitting(true);
    try {
      const feedback = await api.submitInnovationFeedback(token, {
        usefulness: ratings.usefulness!,
        ease_of_use: ratings.ease_of_use!,
        accessibility: ratings.accessibility!,
        fit_to_needs: ratings.fit_to_needs!,
        comment: comment.trim() || null,
        improvement: improvement.trim() || null,
      });
      onSubmitted(feedback);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="m4-form" onSubmit={onSubmit} noValidate>
      {error && (
        <Alert tone="danger" title="Nie udało się zapisać ankiety.">
          {error.message}
        </Alert>
      )}

      {FIELDS.map((field) => (
        <fieldset key={field.key} className="m4-rating-fieldset">
          <legend>{field.label}</legend>
          <div className="m4-rating-options">
            {[1, 2, 3, 4, 5].map((score) => (
              <label key={score}>
                <input
                  type="radio"
                  name={`${formId}-${field.key}`}
                  checked={ratings[field.key] === score}
                  onChange={() => setRatings((prev) => ({ ...prev, [field.key]: score }))}
                />
                {score} — {RATING_SCALE_LABELS[score]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="ds-field">
        <label htmlFor={`${formId}-comment`}>Komentarz (opcjonalnie)</label>
        <textarea
          id={`${formId}-comment`}
          className="ds-input"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={4000}
        />
      </div>
      <div className="ds-field">
        <label htmlFor={`${formId}-improvement`}>Propozycja usprawnienia (opcjonalnie)</label>
        <textarea
          id={`${formId}-improvement`}
          className="ds-input"
          rows={3}
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          maxLength={4000}
        />
      </div>

      <div className="m4-form__actions">
        <button type="submit" className="ds-btn ds-btn--cta" disabled={submitting}>
          {submitting ? "Zapisywanie…" : "Wyślij ankietę"}
        </button>
      </div>
    </form>
  );
}
