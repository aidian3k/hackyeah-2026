import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Stub (K07) — treść strony dodaje K11. */
export function PanelIdeasPage() {
  useDocumentTitle("Pomysły");
  return (
    <div className="ds-page">
      <header className="flex max-w-3xl flex-col gap-3">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          Pomysły
        </h1>
        <p className="m-0 text-body-lg text-ink">Pomysły mieszkańców i organizacji wysłane do Hubu.</p>
      </header>
    </div>
  );
}
