import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import type { MaterialType, TestMode } from "@/api/types";
import { Alert } from "@/components/Alert";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { toApiError } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { MATERIAL_TYPE_LABELS, TEST_MODE_LABELS } from "@/lib/labels";

const MATERIAL_TYPES = Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[];
const MODES = Object.keys(TEST_MODE_LABELS) as TestMode[];

/** Formularz tworzenia kompletnej rekrutacji testerów (OPEN). */
export function PanelInnovationTestCreatePage() {
  useDocumentTitle("Panel: Nowa rekrutacja testerów");
  const navigate = useNavigate();
  const formId = useId();
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [solutionId, setSolutionId] = useState("");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [instruction, setInstruction] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [testerType, setTesterType] = useState("");
  const [location, setLocation] = useState("Małopolska");
  const [seats, setSeats] = useState("5");
  const [mode, setMode] = useState<TestMode>("HYBRID");
  const [duration, setDuration] = useState("ok. 45 min");
  const [endsAt, setEndsAt] = useState("");
  const [materialTitle, setMaterialTitle] = useState("Instrukcja testu");
  const [materialType, setMaterialType] = useState<MaterialType>("INSTRUCTION");
  const [materialLocator, setMaterialLocator] = useState("https://");
  const [materialDescription, setMaterialDescription] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const sid = Number(solutionId);
    const seatsLimit = Number(seats);
    if (!Number.isFinite(sid) || sid <= 0) {
      setError(new ApiError(422, "VALIDATION_ERROR", "Podaj poprawne ID rozwiązania."));
      return;
    }
    if (!endsAt) {
      setError(new ApiError(422, "VALIDATION_ERROR", "Podaj termin zakończenia."));
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createInnovationTest({
        solution_id: sid,
        title: title.trim(),
        goal_description: goal.trim(),
        instruction: instruction.trim(),
        target_group: targetGroup.trim(),
        tester_type: testerType.trim(),
        location: location.trim(),
        seats_limit: seatsLimit,
        mode,
        estimated_duration: duration.trim(),
        ends_at: new Date(endsAt).toISOString(),
        materials: [
          {
            title: materialTitle.trim(),
            type: materialType,
            locator: materialLocator.trim(),
            description: materialDescription.trim(),
            sort_order: 1,
          },
        ],
      });
      navigate(`/panel/testy/${created.id}`);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ds-page max-w-3xl">
      <div className="ds-stack">
        <ModuleLabel module="panel" />
        <p>
          <Link to="/panel/testy">Wróć do rekrutacji testerów</Link>
        </p>
        <h1 tabIndex={-1}>Nowa rekrutacja testerów</h1>
        <p className="m-0 text-body-lg text-ink">
          Rekrutacja od razu jest otwarta. Rozwiązanie musi mieć status PUBLISHED albo PENDING_REVIEW.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        {error && (
          <Alert tone="danger" title="Nie udało się utworzyć rekrutacji testerów.">
            {error.message}
          </Alert>
        )}

        <div className="ds-field">
          <label htmlFor={`${formId}-solution`}>ID rozwiązania</label>
          <input
            id={`${formId}-solution`}
            className="ds-input"
            value={solutionId}
            onChange={(e) => setSolutionId(e.target.value)}
            required
            inputMode="numeric"
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-title`}>Tytuł testu</label>
          <input
            id={`${formId}-title`}
            className="ds-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-goal`}>Cel testu</label>
          <textarea
            id={`${formId}-goal`}
            className="ds-input"
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            minLength={10}
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-instruction`}>Instrukcja testu</label>
          <textarea
            id={`${formId}-instruction`}
            className="ds-input"
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            required
            minLength={10}
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-target`}>Grupa docelowa</label>
          <input
            id={`${formId}-target`}
            className="ds-input"
            value={targetGroup}
            onChange={(e) => setTargetGroup(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-tester`}>Oczekiwani testerzy</label>
          <input
            id={`${formId}-tester`}
            className="ds-input"
            value={testerType}
            onChange={(e) => setTesterType(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-location`}>Lokalizacja</label>
          <input
            id={`${formId}-location`}
            className="ds-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-seats`}>Limit miejsc</label>
          <input
            id={`${formId}-seats`}
            className="ds-input"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-mode`}>Tryb</label>
          <select
            id={`${formId}-mode`}
            className="ds-input"
            value={mode}
            onChange={(e) => setMode(e.target.value as TestMode)}
          >
            {MODES.map((item) => (
              <option key={item} value={item}>
                {TEST_MODE_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-duration`}>Przewidywany czas</label>
          <input
            id={`${formId}-duration`}
            className="ds-input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label htmlFor={`${formId}-ends`}>Termin zakończenia</label>
          <input
            id={`${formId}-ends`}
            className="ds-input"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
          />
        </div>

        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-2 p-0 text-label text-ink">Pierwszy materiał</legend>
          <div className="ds-field">
            <label htmlFor={`${formId}-mat-title`}>Tytuł</label>
            <input
              id={`${formId}-mat-title`}
              className="ds-input"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              required
            />
          </div>
          <div className="ds-field">
            <label htmlFor={`${formId}-mat-type`}>Typ</label>
            <select
              id={`${formId}-mat-type`}
              className="ds-input"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as MaterialType)}
            >
              {MATERIAL_TYPES.map((item) => (
                <option key={item} value={item}>
                  {MATERIAL_TYPE_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="ds-field">
            <label htmlFor={`${formId}-mat-loc`}>Adres lub identyfikator</label>
            <input
              id={`${formId}-mat-loc`}
              className="ds-input"
              value={materialLocator}
              onChange={(e) => setMaterialLocator(e.target.value)}
              required
            />
          </div>
          <div className="ds-field">
            <label htmlFor={`${formId}-mat-desc`}>Opis</label>
            <textarea
              id={`${formId}-mat-desc`}
              className="ds-input"
              rows={2}
              value={materialDescription}
              onChange={(e) => setMaterialDescription(e.target.value)}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="ds-btn ds-btn--cta" disabled={submitting}>
            {submitting ? "Tworzenie…" : "Opublikuj rekrutację"}
          </button>
        </div>
      </form>
    </div>
  );
}
