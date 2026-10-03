import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { KreatorNav } from "@/components/layout/KreatorNav";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Stub (K07) — treść strony dodaje K12. */
export function CallsPage() {
  useDocumentTitle("Nabory");
  return (
    <div className="ds-page">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <ModuleLabel module="kreator" />
          <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
            Nabory
          </h1>
          <p className="m-0 text-body-lg text-ink">Sprawdź otwarte konkursy grantowe i przygotuj wniosek na podstawie swojego pomysłu.</p>
        </div>
        <KreatorNav />
      </header>
    </div>
  );
}
