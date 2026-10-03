import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Moduł 5 — zaślepka z PK20; treść dodaje PK23. */
export function PartnersPage() {
  useDocumentTitle("Tablica partnerstw");
  return (
    <div className="ds-page">
      <header className="flex flex-col gap-2">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          Tablica partnerstw
        </h1>
      </header>
      <p className="m-0">Ta część jest w przygotowaniu.</p>
    </div>
  );
}
