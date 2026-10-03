import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { commApi, type Intent, type OrgSector } from "@/api/comm";
import { Alert } from "@/components/Alert";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { INTENT_LABELS, SECTOR_LABELS } from "@/lib/comm";
import { PRIVACY_WARNING } from "@/lib/labels";
import { getSessionId } from "@/lib/storage";

/** Moduł 5: nowe ogłoszenie na tablicy partnerstw (publikowane od razu). */
export function NewOfferPage() {
  useDocumentTitle("Dodaj ogłoszenie");
  const navigate = useNavigate();
  const { items: taxonomy } = useTaxonomy();
  const id = { intent: useId(), org: useId(), sector: useId(), title: useId(), desc: useId(), cat: useId() };
  const [intent, setIntent] = useState<Intent>("SEEK");
  const [organization, setOrganization] = useState("");
  const [sector, setSector] = useState<OrgSector>("NGO");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (organization.trim().length < 2 || title.trim().length < 3 || description.trim().length < 10) {
      setError("Uzupełnij organizację (min. 2 znaki), tytuł (min. 3) i opis (min. 10 znaków).");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const offer = await commApi.createOffer({
        intent,
        organization,
        sector,
        title,
        description,
        category: category || null,
        session_id: getSessionId(),
      });
      navigate(`/partnerzy/${offer.id}`);
    } catch (err) {
      setError(toApiError(err).message);
      setSending(false);
    }
  }

  return (
    <div className="ds-page max-w-3xl">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          Dodaj ogłoszenie
        </h1>
        <p className="m-0 text-body-lg">
          Napisz, co możecie zaoferować albo jakiego partnera szukacie. Ogłoszenie pojawi się od razu
          na tablicy. Nie podawaj danych kontaktowych — Hub połączy strony w rozmowie.
        </p>
      </header>

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <fieldset className="ds-choices ds-choices--inline">
          <legend className="ds-choices__legend">Rodzaj ogłoszenia</legend>
          {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
            <label key={k} className="ds-choice">
              <input
                className="ds-choice__input"
                type="radio"
                name={id.intent}
                value={k}
                checked={intent === k}
                onChange={() => setIntent(k)}
              />
              {INTENT_LABELS[k]}
            </label>
          ))}
        </fieldset>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id.org}>
            Organizacja
          </label>
          <input id={id.org} className="ds-input max-w-lg" maxLength={300} value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id.sector}>
            Sektor
          </label>
          <select id={id.sector} className="ds-select max-w-lg" value={sector} onChange={(e) => setSector(e.target.value as OrgSector)}>
            {(Object.keys(SECTOR_LABELS) as OrgSector[]).map((k) => (
              <option key={k} value={k}>
                {SECTOR_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id.title}>
            Tytuł
          </label>
          <input id={id.title} className="ds-input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id.desc}>
            Opis
          </label>
          <p id={`${id.desc}-hint`} className="ds-hint">
            {PRIVACY_WARNING}
          </p>
          <textarea
            id={id.desc}
            className="ds-textarea"
            rows={6}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby={`${id.desc}-hint`}
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor={id.cat}>
            Wyzwanie (opcjonalnie)
          </label>
          <p id={`${id.cat}-hint`} className="ds-hint">
            Na tej podstawie pokażemy pasujące ogłoszenia i rozwiązania.
          </p>
          <select
            id={id.cat}
            className="ds-select max-w-lg"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-describedby={`${id.cat}-hint`}
          >
            <option value="">Nie wybieram</option>
            {taxonomy.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label_pl}
              </option>
            ))}
          </select>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        <p className="m-0">
          <button type="submit" className="ds-btn ds-btn--primary" disabled={sending} aria-busy={sending || undefined}>
            {sending ? "Publikujemy…" : "Opublikuj ogłoszenie"}
          </button>
        </p>
      </form>

      <p className="m-0">
        <Link to="/partnerzy" className="ds-btn ds-btn--link px-0">
          Wróć do tablicy partnerstw
        </Link>
      </p>
    </div>
  );
}
