import type { ReactNode } from "react";
import { ModuleLabel } from "./ModuleLabel";
import { ZasobnikNav } from "./ZasobnikNav";

export interface HeaderStat {
  value: number | string;
  label: string;
}

interface Props {
  title: string;
  lead: ReactNode;
  /** Pasek liczb pod leadem (np. „115 innowacji”); pomijany, gdy pusty. */
  stats?: HeaderStat[];
  children?: ReactNode;
}

/** Wspólny nagłówek stron Zasobnika wiedzy: etykieta modułu, h1, lead, liczby, zakładki. */
export function ZasobnikHeader({ title, lead, stats, children }: Props) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-3">
        <ModuleLabel module="zasobnik" />
        <h1 tabIndex={-1} className="m-0 font-sans text-h1 text-navy">
          {title}
        </h1>
        <p className="m-0 text-body-lg text-ink">{lead}</p>
      </div>
      {stats && stats.length > 0 && (
        <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="text-small text-ink-muted">{s.label}</dt>
              <dd className="m-0 font-sans text-h2 text-navy">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
      <ZasobnikNav />
    </header>
  );
}
