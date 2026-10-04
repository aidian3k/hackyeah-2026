import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { api, type ApiError } from "@/api/client";
import type { InnovationTestFeedback } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { RATING_SCALE_LABELS } from "@/lib/labels";

interface Props {
  token: string;
  onSubmitted: (feedback: InnovationTestFeedback) => void;
}

type RatingKey = "usefulness" | "ease_of_use" | "accessibility" | "fit_to_needs";
type TextKey = "comment" | "improvement";

type Question =
  | { kind: "rating"; key: RatingKey; title: string; hint: string; short: string }
  | { kind: "text"; key: TextKey; title: string; hint: string; short: string };

// Kolejność kroków ankiety (feature-2026-10-04-7); pola jak w InnovationTestFeedbackCreate.
const QUESTIONS: Question[] = [
  {
    kind: "rating",
    key: "usefulness",
    title: "Czy to rozwiązanie jest przydatne?",
    hint: "Pomyśl, czy przyda się Tobie, Twoim bliskim albo osobom, z którymi pracujesz.",
    short: "Przydatność",
  },
  {
    kind: "rating",
    key: "ease_of_use",
    title: "Czy łatwo było z niego skorzystać?",
    hint: "Na przykład: czy wiadomo było, co zrobić krok po kroku, bez proszenia kogoś o pomoc.",
    short: "Łatwość użycia",
  },
  {
    kind: "rating",
    key: "accessibility",
    title: "Czy mogą z niego korzystać wszyscy?",
    hint: "Pomyśl o osobach starszych, z niepełnosprawnościami, bez internetu albo mieszkających daleko.",
    short: "Dostępność",
  },
  {
    kind: "rating",
    key: "fit_to_needs",
    title: "Czy odpowiada na prawdziwe potrzeby?",
    hint: "Czy rozwiązuje problem, z którym Ty albo Twoje otoczenie naprawdę się mierzycie?",
    short: "Dopasowanie do potrzeb",
  },
  {
    kind: "text",
    key: "comment",
    title: "Co było najtrudniejsze albo niejasne?",
    hint: "Opisz własnymi słowami, np. „Nie wiedziałam, gdzie zapisać seniora na spotkanie”. Możesz pominąć.",
    short: "Co było trudne",
  },
  {
    kind: "text",
    key: "improvement",
    title: "Co warto zmienić, żeby działało lepiej?",
    hint: "Każdy pomysł się liczy, nawet drobny. Możesz pominąć.",
    short: "Propozycja zmiany",
  },
];

const TOTAL = QUESTIONS.length;
const SUMMARY_STEP = TOTAL;
// Lustro M4_COMMENT_MAX_CHARS (api/config.py).
const TEXT_MAX = 4000;
const SCORES = [1, 2, 3, 4, 5] as const;

interface Answers {
  usefulness: number | null;
  ease_of_use: number | null;
  accessibility: number | null;
  fit_to_needs: number | null;
  comment: string;
  improvement: string;
}

const EMPTY: Answers = {
  usefulness: null,
  ease_of_use: null,
  accessibility: null,
  fit_to_needs: null,
  comment: "",
  improvement: "",
};

const RATING_REQUIRED = "Wybierz ocenę od 1 do 5, żeby przejść dalej.";

const TILE =
  "flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-solid border-line bg-surface px-1 py-3 text-navy hover:bg-surface-muted has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-navy-on has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

/** Ankieta po teście krok po kroku: 4 oceny, 2 pytania otwarte, podsumowanie i jednorazowe wysłanie. */
export function FeedbackForm({ token, onSubmitted }: Props) {
  const uid = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [announce, setAnnounce] = useState("");

  // Zmiana kroku: fokus na nagłówek i komunikat dla czytnika (pierwsze wczytanie — bez przenoszenia fokusu).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    const q = QUESTIONS[step];
    setAnnounce(q ? `Pytanie ${step + 1} z ${TOTAL}: ${q.title}` : "Sprawdź odpowiedzi");
  }, [step]);

  const question = QUESTIONS[step] ?? null;

  function goTo(next: number) {
    setStepError(null);
    setSubmitError(null);
    setStep(next);
  }

  function focusScores() {
    requestAnimationFrame(() => {
      const group = document.getElementById(`${uid}-q${step}`);
      group?.querySelector<HTMLInputElement>("input:checked, input")?.focus();
    });
  }

  function next(event: FormEvent) {
    event.preventDefault();
    if (question?.kind === "rating" && answers[question.key] === null) {
      setStepError(RATING_REQUIRED);
      focusScores();
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    if (submitting) return;
    const missing = QUESTIONS.findIndex((q) => q.kind === "rating" && answers[q.key] === null);
    if (missing >= 0) {
      goTo(missing);
      setStepError(RATING_REQUIRED);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const feedback = await api.submitInnovationFeedback(token, {
        usefulness: answers.usefulness!,
        ease_of_use: answers.ease_of_use!,
        accessibility: answers.accessibility!,
        fit_to_needs: answers.fit_to_needs!,
        comment: answers.comment.trim() || null,
        improvement: answers.improvement.trim() || null,
      });
      onSubmitted(feedback);
    } catch (err) {
      setSubmitError(toApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.round((Math.min(step, TOTAL) / TOTAL) * 100);
  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="m-0 text-body text-ink">
          <strong>{step === SUMMARY_STEP ? "Ostatni krok: sprawdź odpowiedzi" : `Pytanie ${step + 1} z ${TOTAL}`}</strong>
        </p>
        <span className="ds-bar--navy" aria-hidden="true">
          <span className="ds-bar__track">
            <span className="ds-bar__fill" style={{ "--ds-bar-share": `${progress}%` } as CSSProperties} />
          </span>
        </span>
      </div>

      {question ? (
        <form className="flex flex-col gap-6" onSubmit={next} noValidate>
          {question.kind === "rating" ? (
            <fieldset
              id={`${uid}-q${step}`}
              className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0"
              aria-describedby={[hintId, stepError ? errorId : ""].filter(Boolean).join(" ")}
            >
              <legend className="mb-2 p-0">
                <h3 ref={headingRef} tabIndex={-1} className="m-0 font-sans text-h3 text-navy">
                  {question.title}
                </h3>
              </legend>
              <p className="ds-hint m-0" id={hintId}>
                {question.hint}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SCORES.map((score) => (
                  <label key={score} className={TILE}>
                    <input
                      className="sr-only"
                      type="radio"
                      name={`${uid}-${question.key}`}
                      value={score}
                      checked={answers[question.key] === score}
                      onChange={() => {
                        setAnswers((a) => ({ ...a, [question.key]: score }));
                        setStepError(null);
                      }}
                    />
                    <span className="font-sans text-h2" aria-hidden="true">
                      {score}
                    </span>
                    <span className="text-center text-small [overflow-wrap:anywhere]">
                      <span className="sr-only">{`${score} — `}</span>
                      {RATING_SCALE_LABELS[score]}
                    </span>
                  </label>
                ))}
              </div>
              {stepError && (
                <p className="ds-error m-0" id={errorId}>
                  {stepError}
                </p>
              )}
            </fieldset>
          ) : (
            <div className="ds-field">
              <h3 ref={headingRef} tabIndex={-1} className="m-0 font-sans text-h3 text-navy">
                <label htmlFor={`${uid}-q${step}`} className="font-sans">
                  {question.title} <span className="font-normal text-ink-muted">(opcjonalnie)</span>
                </label>
              </h3>
              <p className="ds-hint" id={hintId}>
                {question.hint}
              </p>
              <textarea
                id={`${uid}-q${step}`}
                className="ds-textarea"
                rows={5}
                value={answers[question.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [question.key]: e.target.value }))}
                maxLength={TEXT_MAX}
                aria-describedby={hintId}
              />
              {question.key === "comment" && (
                <p className="ds-hint">Hub może pokazać Twoje odpowiedzi autorowi rozwiązania — zawsze bez imienia.</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" className="ds-btn" onClick={() => goTo(step - 1)}>
                Wstecz
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="ds-btn ds-btn--primary">
              {question.kind === "text" && !answers[question.key].trim() ? "Pomiń" : "Dalej"}
            </button>
          </div>
        </form>
      ) : (
        <section className="flex flex-col gap-6" aria-labelledby={`${uid}-summary`}>
          <h3 id={`${uid}-summary`} ref={headingRef} tabIndex={-1} className="m-0 font-sans text-h3 text-navy">
            Sprawdź odpowiedzi
          </h3>
          <p className="m-0 text-body text-ink">
            Po wysłaniu nie da się już poprawić ankiety. Jeśli chcesz coś zmienić, użyj przycisku „Zmień”.
          </p>
          <dl className="m-0 flex flex-col gap-3">
            {QUESTIONS.map((q, i) => {
              const value = answers[q.key];
              const shown =
                q.kind === "rating"
                  ? value === null
                    ? "Brak oceny"
                    : `${value} — ${RATING_SCALE_LABELS[value as number]}`
                  : (value as string).trim() || "Pominięto";
              return (
                <div
                  key={q.key}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-surface-muted p-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <dt className="m-0 text-label text-ink-muted">{q.short}</dt>
                    <dd className="m-0 whitespace-pre-line text-body text-ink [overflow-wrap:anywhere]">{shown}</dd>
                  </div>
                  <button type="button" className="ds-btn ds-btn--small" onClick={() => goTo(i)}>
                    Zmień<span className="sr-only">{`: ${q.short}`}</span>
                  </button>
                </div>
              );
            })}
          </dl>

          <div role="alert" className="empty:hidden">
            {submitError && (
              <Alert tone="danger" title="Nie udało się zapisać ankiety.">
                {submitError.message}
              </Alert>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="ds-btn" onClick={() => goTo(TOTAL - 1)}>
              Wstecz
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--cta"
              onClick={() => void submit()}
              aria-disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Wysyłanie…" : "Wyślij ankietę"}
            </button>
          </div>
        </section>
      )}

      <p className="ds-sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
