import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Moduł 7: wejście do Middlemana innowacji `/wdrozenie` — zaślepka (MI10), strona w MI12. */
export function MiddlemanHomePage() {
  useDocumentTitle("Middleman innowacji");
  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="middleman" />
        <h1 tabIndex={-1} className="m-0">
          Middleman innowacji
        </h1>
        <p className="m-0 text-body-lg">W przygotowaniu.</p>
      </header>
    </div>
  );
}
