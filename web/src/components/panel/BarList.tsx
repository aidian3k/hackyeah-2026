import type { CSSProperties, ReactNode } from "react";
import { plural } from "@/lib/format";

/** Kod kategorii → modyfikator słupka (tabela kategorii w DESIGN.md, klasy ds-bar--… z F03). */
export const CATEGORY_BAR_CLASS: Record<string, string> = {
  AGING: "ds-bar--blue",
  MENTAL_HEALTH: "ds-bar--magenta",
  LONELINESS: "ds-bar--violet",
  DIGITAL_EXCLUSION: "ds-bar--cyan",
  SERVICE_ACCESS: "ds-bar--green",
  DEPOPULATION: "ds-bar--yellow",
  SUBURBAN_GROWTH: "ds-bar--yellow",
  COORDINATION: "ds-bar--navy",
};

// OTHER, brak kategorii i nieznane kody: neutralny kontur zamiast koloru kategorii.
const NEUTRAL_BAR_STYLE = { "--ds-bar-color": "var(--line-strong)" } as CSSProperties;

export interface BarItem {
  key: string;
  /** Podpis słupka (tekst albo link). */
  label: ReactNode;
  total: number;
  matched: number;
  unmatched: number;
  /** Modyfikator ds-bar--…; brak → kolor neutralny. */
  colorClass?: string | null;
}

/** „12 zgłoszeń, w tym 5 bez dopasowania” — liczby słownie, żeby nie polegać na kolorze. */
export function barValueText({ total, unmatched }: Pick<BarItem, "total" | "unmatched">): string {
  const head = `${total} ${plural(total, "zgłoszenie", "zgłoszenia", "zgłoszeń")}`;
  if (total === 0) return head;
  if (unmatched === 0) return `${head}, ${total === 1 ? "dopasowane" : "wszystkie dopasowane"}`;
  if (unmatched === total) return `${head}, ${total === 1 ? "bez dopasowania" : "wszystkie bez dopasowania"}`;
  return `${head}, w tym ${unmatched} bez dopasowania`;
}

function share(n: number, max: number): string {
  return `${max > 0 ? Math.round((n / max) * 10000) / 100 : 0}%`;
}

interface Props {
  items: BarItem[];
  /** id nagłówka opisującego wykres. */
  labelledBy?: string;
}

/**
 * Poziome słupki CSS (bez biblioteki). Długość względem największej grupy; część wypełniona =
 * z dopasowaniem, część z konturem = bez dopasowania. Ścieżka słupka jest aria-hidden —
 * czytnik czyta podpis i wartość słownie.
 */
export function BarList({ items, labelledBy }: Props) {
  const max = Math.max(0, ...items.map((i) => i.total));
  return (
    <ul className="ds-bar-list" aria-labelledby={labelledBy}>
      {items.map((item) => (
        <li
          key={item.key}
          className={`ds-bar ${item.colorClass ?? ""}`.trim()}
          style={item.colorClass ? undefined : NEUTRAL_BAR_STYLE}
        >
          <span className="ds-bar__label">{item.label}</span>
          <span className="ds-bar__track" aria-hidden="true">
            {item.matched > 0 && (
              <span className="ds-bar__fill" style={{ "--ds-bar-share": share(item.matched, max) } as CSSProperties} />
            )}
            {item.unmatched > 0 && (
              <span
                className="ds-bar__fill ds-bar__fill--rest"
                style={{ "--ds-bar-share": share(item.unmatched, max) } as CSSProperties}
              />
            )}
          </span>
          <span className="ds-bar__value">{barValueText(item)}</span>
        </li>
      ))}
    </ul>
  );
}
