import { useId, useRef, useState, type FormEvent } from "react";

interface Props {
  onSubmit(text: string): void;
  /** Jedno zdanie zachęty nad polem (opcjonalnie). */
  intro?: string;
}

/** Pytanie doprecyzowujące: dopisany tekst idzie jako nowe wyszukiwanie (useChat.followUp). */
export function FollowUp({ onSubmit, intro }: Props) {
  const id = useId();
  const fieldId = `${id}-pole`;
  const errorId = `${id}-blad`;
  const introId = `${id}-opis`;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Wpisz odpowiedź w kilku słowach.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit(text);
  };

  const describedBy = [intro ? introId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <form className="follow-up ds-stack" onSubmit={submit} noValidate>
      {intro && (
        <p id={introId} className="follow-up__intro">
          {intro}
        </p>
      )}
      <div className="ds-field">
        <label className="ds-label" htmlFor={fieldId}>
          Twoja odpowiedź
        </label>
        <textarea
          ref={inputRef}
          id={fieldId}
          className="ds-textarea follow-up__input"
          rows={2}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {error && (
          <p id={errorId} className="ds-error">
            {error}
          </p>
        )}
      </div>
      <div>
        <button type="submit" className="ds-btn ds-btn--primary">
          Doprecyzuj
        </button>
      </div>
    </form>
  );
}
