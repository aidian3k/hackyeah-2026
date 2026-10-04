import type { ReactElement } from "react";
import type { CanvasRole, CanvasStatus, Partner } from "@/api/types";
import { plural } from "@/lib/format";

type MarkerShape = "star" | "square" | "plus" | "circle";

/** Znacznik statusu partnera: gwiazdka (potwierdzony), kwadrat (rozmowy), plus (potencjalny). */
const SHAPE_BY_STATUS: Record<string, MarkerShape> = {
  CONFIRMED: "star",
  TALKING: "square",
  POTENTIAL: "plus",
};
const SHAPES_BY_INDEX: MarkerShape[] = ["star", "square", "plus"];

export function statusShape(status: string, statuses: CanvasStatus[]): MarkerShape {
  const known = SHAPE_BY_STATUS[status];
  if (known) return known;
  const i = statuses.findIndex((s) => s.code === status);
  return SHAPES_BY_INDEX[i] ?? "circle";
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Kształt znacznika w układzie współrzędnych SVG (środek `x`,`y`, promień ok. `s`). */
export function MarkerGlyph({ shape, x, y, s = 10 }: { shape: MarkerShape; x: number; y: number; s?: number }) {
  switch (shape) {
    case "star":
      return <polygon points={starPoints(x, y, s * 1.15, s * 0.5)} className="fill-navy stroke-navy" strokeWidth={1} />;
    case "square":
      return <rect x={x - s * 0.8} y={y - s * 0.8} width={s * 1.6} height={s * 1.6} className="fill-navy stroke-navy" strokeWidth={1} />;
    case "plus":
      return (
        <path
          d={`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`}
          className="fill-none stroke-navy"
          strokeWidth={s * 0.55}
          strokeLinecap="butt"
        />
      );
    default:
      return <circle cx={x} cy={y} r={s * 0.8} className="fill-navy" />;
  }
}

/** Mała ikonka znacznika do legendy i list (HTML). */
export function MarkerIcon({ shape }: { shape: MarkerShape }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <MarkerGlyph shape={shape} x={12} y={12} s={9} />
    </svg>
  );
}

// Geometria: 3 koła o promieniu R wokół środka (300, 300), środki w odległości D.
const CX = 300;
const CY = 300;
const D = 100;
const R = 170;
// Kierunki kół: 0 — góra, 1 — lewy dół, 2 — prawy dół.
const DIRS: [number, number][] = [
  [0, -1],
  [-Math.sqrt(3) / 2, 0.5],
  [Math.sqrt(3) / 2, 0.5],
];
function dir(i: number): [number, number] {
  return DIRS[i] ?? [0, 0];
}
/** Wygląd kół: wypełnienie paskiem (półprzezroczyste), obrys w kolorze kategorii, różny wzór linii (nie tylko kolor). */
const CIRCLES: {
  fill: string;
  stroke: string;
  dash?: string;
  label: { x: number; y: number; anchor: "middle" | "start" | "end" };
}[] = [
  { fill: "fill-stripe-blue", stroke: "stroke-cat-blue", label: { x: CX, y: 22, anchor: "middle" } },
  { fill: "fill-stripe-magenta", stroke: "stroke-cat-magenta", dash: "12 6", label: { x: 20, y: 552, anchor: "start" } },
  { fill: "fill-stripe-green", stroke: "stroke-cat-green", dash: "3 6", label: { x: 580, y: 552, anchor: "end" } },
];

/** Punkt zaczepienia regionu (7 regionów = niepuste podzbiory 3 ról). */
function regionAnchor(key: string): [number, number] {
  if (key.length === 3) return [CX, CY + 38];
  if (key.length === 1) {
    const [dx, dy] = dir(Number(key));
    return [CX + 185 * dx, CY + 185 * dy];
  }
  // Część wspólna dwóch kół: po przeciwnej stronie środka niż trzecie koło.
  const missing = [0, 1, 2].find((i) => !key.includes(String(i))) ?? 0;
  const [dx, dy] = dir(missing);
  return [CX - 120 * dx, CY - 120 * dy];
}

/** Region partnera: posortowane indeksy jego ról (spośród pierwszych trzech ról definicji), np. "01". */
export function partnerRegion(partner: Partner, roles: CanvasRole[]): string {
  return roles
    .slice(0, 3)
    .map((r, i) => (partner.roles.includes(r.code) ? String(i) : ""))
    .join("");
}

interface Props {
  partners: Partner[];
  roles: CanvasRole[];
  statuses: CanvasStatus[];
}

/**
 * Konstelacja partnerów: 3 koła ról (np. taniej / dotarcie / wartość) wokół „Twojego rozwiązania”.
 * Partner trafia do regionu odpowiadającego kombinacji jego ról; kształt znacznika = status, numer = pozycja na liście.
 */
export function PartnerConstellation({ partners, roles, statuses }: Props) {
  const circleRoles = roles.slice(0, 3);
  const groups = new Map<string, { index: number; partner: Partner }[]>();
  partners.forEach((partner, index) => {
    const key = partnerRegion(partner, roles);
    if (!key) return;
    const list = groups.get(key) ?? [];
    list.push({ index, partner });
    groups.set(key, list);
  });
  const withoutRole = partners.filter((p) => !partnerRegion(p, roles)).length;

  const n = partners.length;
  const roleCounts = circleRoles.map((r) => {
    const c = partners.filter((p) => p.roles.includes(r.code)).length;
    return `${r.label} — ${c}`;
  });
  const description = [
    `Konstelacja partnerów: ${n} ${plural(n, "partner", "partnerów", "partnerów")}.`,
    n ? `Liczba partnerów w rolach: ${roleCounts.join("; ")}.` : "",
    withoutRole ? `Bez zaznaczonej roli: ${withoutRole}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const markers: ReactElement[] = [];
  groups.forEach((list, key) => {
    const [ax, ay] = regionAnchor(key);
    const perRow = key.length === 3 ? 4 : 3;
    const rows = Math.ceil(list.length / perRow);
    list.forEach(({ index, partner }, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, list.length - row * perRow);
      const col = i % perRow;
      const x = ax + (col - (inRow - 1) / 2) * 42 - 6;
      const y = ay + (row - (rows - 1) / 2) * 30;
      markers.push(
        <g key={index}>
          <MarkerGlyph shape={statusShape(partner.status, statuses)} x={x} y={y} />
          <text x={x + 13} y={y + 6} fontSize={17} fontWeight={700} className="fill-ink">
            {index + 1}
          </text>
        </g>,
      );
    });
  });

  const legendStatuses = statuses.map((s) => ({ ...s, shape: statusShape(s.code, statuses) }));

  return (
    <figure className="m-0 flex flex-col gap-3">
      <svg role="img" aria-label={description} viewBox="0 0 600 570" className="h-auto w-full max-w-xl self-center">
        {CIRCLES.map((c, i) => {
          const role = circleRoles[i];
          if (!role) return null;
          const [dx, dy] = dir(i);
          return (
            <circle
              key={role.code}
              cx={CX + D * dx}
              cy={CY + D * dy}
              r={R}
              className={`${c.fill} ${c.stroke}`}
              fillOpacity={0.12}
              strokeWidth={3}
              strokeDasharray={c.dash}
            />
          );
        })}
        {CIRCLES.map((c, i) => {
          const role = circleRoles[i];
          if (!role) return null;
          return (
            <text
              key={role.code}
              x={c.label.x}
              y={c.label.y}
              textAnchor={c.label.anchor}
              fontSize={19}
              fontWeight={700}
              className="fill-ink"
            >
              {role.label}
            </text>
          );
        })}
        <text x={CX} y={CY - 18} textAnchor="middle" fontSize={16} fontWeight={700} className="fill-ink">
          <tspan x={CX}>Twoje</tspan>
          <tspan x={CX} dy={19}>
            rozwiązanie
          </tspan>
        </text>
        {markers}
      </svg>
      <figcaption className="flex flex-col gap-1 text-small text-ink">
        <ul aria-label="Legenda znaczników" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
          {legendStatuses.map((s) => (
            <li key={s.code} className="inline-flex items-center gap-2">
              <MarkerIcon shape={s.shape} />
              {s.label}
            </li>
          ))}
        </ul>
        <span className="text-ink-muted">Numer przy znaczniku to numer partnera na liście.</span>
        {withoutRole > 0 && (
          <span className="text-ink-muted">{`Bez zaznaczonej roli (poza kołami): ${withoutRole}.`}</span>
        )}
      </figcaption>
    </figure>
  );
}
