import { MODULE_NAMES, type ModuleKey } from "@/lib/modules";

/** Podpis z nazwą modułu nad `h1` strony (nagłówek zostaje przyjazny dla mieszkańca). */
export function ModuleLabel({ module }: { module: ModuleKey }) {
  return <p className="module-label">{MODULE_NAMES[module]}</p>;
}
