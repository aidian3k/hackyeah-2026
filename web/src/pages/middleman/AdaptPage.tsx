import { useParams } from "react-router-dom";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Moduł 7: rozmowa o wdrożeniu innowacji `/wdrozenie/:id` — zaślepka (MI10), ekran w MI11. */
export function AdaptPage() {
  const { id } = useParams();
  useDocumentTitle("Middleman innowacji");
  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="middleman" />
        <h1 tabIndex={-1} className="m-0">
          Jak wdrożyć tę innowację u siebie
        </h1>
        <p className="m-0 text-body-lg">W przygotowaniu (innowacja nr {id}).</p>
      </header>
    </div>
  );
}
