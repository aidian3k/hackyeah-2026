import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { IdeaForm } from "@/components/idea/IdeaForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import "@/styles/idea.css";

// F13: fiszka pomysłu. Wysłany pomysł trafia do kolejki Hubu (PENDING_REVIEW), nie do biblioteki.
export function IdeaPage() {
  useDocumentTitle("Mam pomysł");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [focusTarget, setFocusTarget] = useState<"success" | "form" | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTarget === "success") successRef.current?.focus();
    if (focusTarget === "form") formWrapRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
  }, [focusTarget, createdId, formKey]);

  function handleCreated(id: number) {
    setCreatedId(id);
    setFocusTarget("success");
  }

  function startOver() {
    setCreatedId(null);
    setFormKey((k) => k + 1);
    setFocusTarget("form");
  }

  return (
    <div className="ds-page idea-page">
      <header className="idea-page__intro">
        <ModuleLabel module="kreator" />
        <h1 tabIndex={-1}>Podziel się pomysłem</h1>
        <p className="idea-page__lead">
          Opisz rozwiązanie, które działa albo które chcesz sprawdzić. Zespół Hubu je przejrzy, zanim pojawi się w
          bibliotece.
        </p>
      </header>

      {createdId !== null ? (
        <div ref={successRef} tabIndex={-1} className="idea-page__success" role="status">
          <Alert tone="success" title="Wysłano.">
            {`Pomysł nr ${createdId} czeka na przejrzenie przez zespół Hubu.`}
          </Alert>
          <p>
            <button type="button" className="ds-btn ds-btn--link idea-page__again" onClick={startOver}>
              Zgłoś kolejny pomysł
            </button>
          </p>
        </div>
      ) : (
        <div ref={formWrapRef}>
          <IdeaForm key={formKey} onCreated={handleCreated} />
        </div>
      )}
    </div>
  );
}
