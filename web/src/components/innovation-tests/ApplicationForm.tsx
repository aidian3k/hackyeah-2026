import { useEffect, useId, useState, type FormEvent } from "react";
import { api, ApiError } from "@/api/client";
import type { InnovationTestApplicationPublic, TesterType } from "@/api/types";
import { Alert } from "@/components/Alert";
import { toApiError } from "@/hooks/useApi";
import { TESTER_TYPE_LABELS } from "@/lib/labels";

interface Props {
  testId: number;
  onSubmitted: (result: InnovationTestApplicationPublic) => void;
}

const TESTER_TYPES = Object.keys(TESTER_TYPE_LABELS) as TesterType[];

export function ApplicationForm({ testId, onSubmitted }: Props) {
  const formId = useId();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [testerType, setTesterType] = useState<TesterType>("RESIDENT");
  const [wojewodztwo, setWojewodztwo] = useState("małopolskie");
  const [powiat, setPowiat] = useState("");
  const [gmina, setGmina] = useState("");
  const [isTarget, setIsTarget] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    api.innovationConsent().then(
      (meta) => {
        if (active) setConsentText(meta.text_pl);
      },
      () => {
        if (active) {
          setConsentText(
            "Wyrażam zgodę na kontakt w sprawie udziału w tej rekrutacji testerów oraz na przetwarzanie podanych danych przez Hub.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!consent) {
      setError(new ApiError(422, "VALIDATION_ERROR", "Zgoda jest wymagana."));
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.applyInnovationTest(testId, {
        display_name: displayName.trim(),
        email: email.trim(),
        tester_type: testerType,
        wojewodztwo: wojewodztwo.trim(),
        powiat: powiat.trim(),
        gmina: gmina.trim(),
        is_target_group_member: isTarget,
        motivation: motivation.trim(),
        consent: true,
      });
      onSubmitted(result);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {error && (
        <Alert tone="danger" title="Nie udało się wysłać zgłoszenia.">
          {error.message}
        </Alert>
      )}

      <div className="ds-field">
        <label htmlFor={`${formId}-name`}>Imię lub nazwa organizacji</label>
        <input
          id={`${formId}-name`}
          className="ds-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={300}
          autoComplete="organization"
        />
      </div>

      <div className="ds-field">
        <label htmlFor={`${formId}-email`}>E-mail</label>
        <input
          id={`${formId}-email`}
          className="ds-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={320}
          autoComplete="email"
        />
        <p className="ds-hint">Widoczny wyłącznie dla Hubu.</p>
      </div>

      <div className="ds-field">
        <label htmlFor={`${formId}-type`}>Typ testera</label>
        <select
          id={`${formId}-type`}
          className="ds-input"
          value={testerType}
          onChange={(e) => setTesterType(e.target.value as TesterType)}
        >
          {TESTER_TYPES.map((type) => (
            <option key={type} value={type}>
              {TESTER_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="ds-field">
        <label htmlFor={`${formId}-woj`}>Województwo</label>
        <input
          id={`${formId}-woj`}
          className="ds-input"
          value={wojewodztwo}
          onChange={(e) => setWojewodztwo(e.target.value)}
          required
        />
      </div>
      <div className="ds-field">
        <label htmlFor={`${formId}-powiat`}>Powiat</label>
        <input
          id={`${formId}-powiat`}
          className="ds-input"
          value={powiat}
          onChange={(e) => setPowiat(e.target.value)}
          required
        />
      </div>
      <div className="ds-field">
        <label htmlFor={`${formId}-gmina`}>Gmina</label>
        <input
          id={`${formId}-gmina`}
          className="ds-input"
          value={gmina}
          onChange={(e) => setGmina(e.target.value)}
          required
        />
      </div>

      <label className="ds-choice">
        <input
          className="ds-choice__input"
          type="checkbox"
          checked={isTarget}
          onChange={(e) => setIsTarget(e.target.checked)}
        />
        Należę do grupy docelowej tego rozwiązania
      </label>

      <div className="ds-field">
        <label htmlFor={`${formId}-motivation`}>Dlaczego chcesz przetestować rozwiązanie?</label>
        <textarea
          id={`${formId}-motivation`}
          className="ds-input"
          rows={4}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
        />
      </div>

      <label className="ds-choice">
        <input
          className="ds-choice__input"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        {consentText}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="ds-btn ds-btn--cta" disabled={submitting}>
          {submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
        </button>
      </div>
    </form>
  );
}
