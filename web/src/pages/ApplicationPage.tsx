import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Stub (K07) — treść strony dodaje K12. */
export function ApplicationPage() {
  useDocumentTitle("Wniosek");
  return (
    <div className="ds-page">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Wniosek
          </h1>
          <p className="m-0 text-body-lg text-ink">Uzupełnij wniosek. Część odpowiedzi wypełniliśmy na podstawie fiszki i kanwy.</p>
        </div>
        <KreatorNav />
      </header>
    </div>
  );
}
