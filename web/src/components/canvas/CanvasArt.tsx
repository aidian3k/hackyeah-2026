/**
 * Grafika Social Canvas na wzór plansz PDF (INNOAGH): ikony obszarów, twarze przy skali problemu,
 * sylwetki przy skali, ikony prostoty rozwiązania, schemat planszy na wstępie arkusza.
 * Wszystko to dekoracja (`aria-hidden`) — znaczenie zawsze niesie tekst obok. Kolory wyłącznie z tokenów
 * (`fill-current` / `stroke-current` + klasy kolorów presetu), więc tryb wysokiego kontrastu działa sam.
 */
import type { ReactElement, ReactNode } from "react";
import type { CanvasSheet } from "@/api/types";
import { MAP_COLUMNS } from "@/components/canvas/layout";

interface IconProps {
  className?: string;
}

/** Ikona konturowa 24×24, grubość 2 (jak w DESIGN.md). */
function Icon({ className = "h-6 w-6", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2] ${className}`}
    >
      {children}
    </svg>
  );
}

// --- kształty ikon (wnętrze <svg> 24×24) ---------------------------------------------

const GLYPHS: Record<string, ReactElement> = {
  // Problem: zmartwiona twarz
  problem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 16.5c2-1.6 5-1.6 7 0M9 10h.01M15 10h.01" />
    </>
  ),
  // Aktorzy zmiany: dwie osoby
  actors: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.6c.5-.1 1-.1 1.5-.1 2.4 0 4.2 1.7 4.6 4.8" />
    </>
  ),
  support: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6M18.5 7v6M15.5 10h6" />
    </>
  ),
  block: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6M15.5 10h6" />
    </>
  ),
  // Rozwiązanie: żarówka
  solution: (
    <>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  // Koszty: stos monet
  costs: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
    </>
  ),
  // Odbiorcy: osoba w kręgu (tarcza)
  recipients: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="9.5" r="2.8" />
      <path d="M7 18.2c.9-2.4 2.7-3.7 5-3.7s4.1 1.3 5 3.7" />
    </>
  ),
  // Dochody: portfel
  revenue: (
    <>
      <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3M4 7.5A2.5 2.5 0 0 1 6.5 5H17v2.5M4 7.5h15a1 1 0 0 1 1 1V11" />
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z" />
    </>
  ),
  // Wartość: serce
  value: <path d="M12 20.5 4.2 12.9a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.8.8.8-.8a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7z" />,
  // Wartość funkcjonalna: kafelek z ptaszkiem
  functional: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  // Notatka: chmurka jak na planszy („wypiszcie poniżej”)
  note: <path d="M7 18.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6-1A4.5 4.5 0 0 0 7 18.5z" />,
  // Kanały: megafon
  channels: (
    <>
      <path d="M3.5 10v4h3l8 4.5V5.5l-8 4.5z" />
      <path d="M6.5 14l1.3 5h2.5l-1-4.5M18 9a4 4 0 0 1 0 6M20.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  // Partnerzy: trzy koła (konstelacja)
  partners: (
    <>
      <circle cx="12" cy="8" r="5" />
      <circle cx="8" cy="15" r="5" />
      <circle cx="16" cy="15" r="5" />
    </>
  ),
  // Wpływ: kiełek
  impact: (
    <>
      <path d="M12 21v-9M12 12c0-4-3-6.5-7.5-6.5 0 4.2 3 6.5 7.5 6.5zM12 14.5c0-3.5 2.6-5.8 7.5-5.8 0 3.8-3 5.8-7.5 5.8z" />
    </>
  ),
  // Wpływ na osobę
  person: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20.5c.7-4 3.5-6.5 7-6.5s6.3 2.5 7 6.5" />
    </>
  ),
  // Wpływ na społeczność: trzy osoby
  community: (
    <>
      <circle cx="12" cy="6.5" r="2.5" />
      <circle cx="5.5" cy="10" r="2" />
      <circle cx="18.5" cy="10" r="2" />
      <path d="M8 19c.4-3.3 1.9-5.3 4-5.3s3.6 2 4 5.3M2 19c.3-2.4 1.5-3.8 3.5-3.8 1 0 1.8.3 2.4 1M22 19c-.3-2.4-1.5-3.8-3.5-3.8-1 0-1.8.3-2.4 1" />
    </>
  ),
};

/** Ikona obszaru albo bloku (blok ma pierwszeństwo, np. „Wspierają zmianę” → osoba z plusem). */
const BLOCK_GLYPH: Record<string, string> = {
  actors_support: "support",
  actors_block: "block",
  revenue_main_note: "note",
  revenue_scaling_note: "note",
  value_functional: "functional",
  impact_person: "person",
  impact_community: "community",
  impact_environment: "impact",
};

export function CanvasIcon({ area, blockId, className }: IconProps & { area: string; blockId?: string }) {
  const key = (blockId && BLOCK_GLYPH[blockId]) || area;
  return <Icon className={className}>{GLYPHS[key] ?? <circle cx="12" cy="12" r="8" />}</Icon>;
}

/** Stan kafelka mapy: pełne kółko z ptaszkiem (uzupełnione) albo przerywany okrąg (puste). Kształt, nie tylko kolor. */
export function FilledMark({
  filled,
  className = "h-5 w-5",
  inverted = false,
}: IconProps & { filled: boolean; /** Na ciemnym tle (bieżący kafelek): ptaszek w kolorze `navy`. */ inverted?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" className={`shrink-0 ${className}`}>
      {filled ? (
        <>
          <circle cx="10" cy="10" r="9" className="fill-current" />
          <path d="M5.8 10.3l2.8 2.8 5.6-6" className={`fill-none ${inverted ? "stroke-navy" : "stroke-surface"} [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.2]`} />
        </>
      ) : (
        <circle cx="10" cy="10" r="8" className="fill-none stroke-current [stroke-dasharray:3_3] [stroke-width:2]" />
      )}
    </svg>
  );
}

// --- grafika opcji -------------------------------------------------------------------

/** Twarz ze skali problemu (poziom 1 = lekko przeszkadza … 4 = bardzo poważny, „płomień” jak na planszy). */
function Face({ level }: { level: number }) {
  if (level >= 4) {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 40 40" className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 text-cat-magenta">
        <path
          d="M20 37c-7.5 0-12.5-5-12.5-11.5 0-5.4 3.6-8.6 5.6-12.4.6 2.8 2 4.6 3.6 5.4C16.4 12.3 19 6.4 23.6 3c-.4 5.4 2.2 8.4 5 11.6 2.4 2.8 3.9 6 3.9 10.9C32.5 32 27.5 37 20 37z"
          className="fill-soft-magenta stroke-current [stroke-linejoin:round] [stroke-width:2.2]"
        />
        <path d="M20 33c-3.2 0-5.2-2.2-5.2-5 0-3 2.4-4.6 3.4-7 1.5 2 5.2 3.6 5.2 7.4 0 2.6-1.4 4.6-3.4 4.6z" className="fill-current" />
      </svg>
    );
  }
  const mouth = level === 3 ? "M13.5 28c3.8-3.4 9.2-3.4 13 0" : level === 2 ? "M14 26.5h12" : "M13.5 24.5c3.8 3.4 9.2 3.4 13 0";
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 40 40" className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 text-ink">
      <circle cx="20" cy="20" r="16.5" className="fill-soft-yellow stroke-current [stroke-width:2]" />
      <circle cx="14.5" cy="16" r="2" className="fill-current" />
      <circle cx="25.5" cy="16" r="2" className="fill-current" />
      {level === 3 && <path d="M11 11.5l5 2M29 11.5l-5 2" className="fill-none stroke-current [stroke-linecap:round] [stroke-width:2]" />}
      <path d={mouth} className="fill-none stroke-current [stroke-linecap:round] [stroke-width:2.2]" />
    </svg>
  );
}

/** Ludzie ze „Skali problemu”: 1, 3, 6 albo 10 głów w piramidzie, jak na planszy. */
function People({ count }: { count: number }) {
  const rows: number[] = [];
  let left = count;
  for (let r = 1; left > 0; r++) {
    rows.push(Math.min(r, left));
    left -= r;
  }
  const heads: ReactElement[] = [];
  const step = 9;
  const top = 40 - rows.length * step;
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) {
      const x = 20 + (i - (n - 1) / 2) * step;
      const y = top + r * step + 4;
      heads.push(<circle key={`${r}-${i}`} cx={x} cy={y} r={3.6} className="fill-soft-yellow stroke-current [stroke-width:1.6]" />);
    }
  });
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 40 40" className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 text-ink">
      {heads}
    </svg>
  );
}

/** Ikony „Prostoty i zrozumiałości” z planszy: ?, puzzel, ptaszek, dymek. */
const CLARITY: Record<string, ReactElement> = {
  UNCLEAR: (
    <path d="M15 15.5a5 5 0 1 1 7.2 4.5c-1.4.7-2.2 1.6-2.2 3.2V25M20 30.5v.5" className="fill-none stroke-current [stroke-linecap:round] [stroke-width:3]" />
  ),
  PARTLY_CLEAR: (
    <path
      d="M9 13h6a3 3 0 1 1 6 0h6v6a3 3 0 1 1 0 6v6h-6a3 3 0 1 0-6 0H9v-6a3 3 0 1 0 0-6z"
      className="fill-soft-green stroke-current [stroke-linejoin:round] [stroke-width:2]"
    />
  ),
  CLEAR: (
    <>
      <rect x="7" y="7" width="26" height="26" rx="5" className="fill-soft-green stroke-current [stroke-width:2]" />
      <path d="M13 20.5l5 5 9-10" className="fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:3]" />
    </>
  ),
  SELF_EXPLAINING: (
    <>
      <circle cx="12" cy="17" r="4.5" className="fill-none stroke-current [stroke-width:2]" />
      <path d="M4 34c.8-5.4 3.8-8.5 8-8.5s7.2 3.1 8 8.5" className="fill-none stroke-current [stroke-linecap:round] [stroke-width:2]" />
      <path d="M21 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 4v-4h-2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" className="fill-soft-blue stroke-current [stroke-linejoin:round] [stroke-width:2]" />
      <path d="M24 10.5h8M24 13.5h5" className="fill-none stroke-current [stroke-linecap:round] [stroke-width:1.6]" />
    </>
  ),
};

const PEOPLE_BY_SCALE: Record<string, number> = { INDIVIDUALS: 1, NARROW: 3, LARGE: 6, VERY_WIDE: 10 };

/** Grafika przy opcji bloku `single` (jeśli plansza ją ma); `null`, gdy blok jej nie przewiduje. */
export function OptionArt({ blockId, code, level }: { blockId: string; code: string; level: number | null }) {
  if ((blockId === "problem_intensity" || blockId === "problem_frequency") && level) return <Face level={level} />;
  if (blockId === "problem_scale" && PEOPLE_BY_SCALE[code]) return <People count={PEOPLE_BY_SCALE[code]} />;
  if (blockId === "solution_clarity" && CLARITY[code]) {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 40 40" className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 text-navy">
        {CLARITY[code]}
      </svg>
    );
  }
  return null;
}

// --- schemat planszy (wstęp arkusza) ------------------------------------------------------

/**
 * Schemat planszy arkusza: ramka z kolumnami obszarów jak w PDF, w każdym obszarze ikona.
 */
export function SheetIllustration({ sheet, className = "w-full max-w-md" }: { sheet: CanvasSheet; className?: string }) {
  const columns = MAP_COLUMNS[sheet.id] ?? sheet.areas.map((a) => ({ areas: [a.id], span: 1 }));
  const units = columns.reduce((n, c) => n + c.span, 0);
  const W = 320;
  const H = 180;
  const pad = 8;
  const colW = (W - pad * 2) / units;
  const boxes: ReactElement[] = [];
  let x = pad;
  columns.forEach((col, ci) => {
    const w = colW * col.span;
    const h = (H - pad * 2 - 18) / col.areas.length;
    col.areas.forEach((areaId, ai) => {
      const y = pad + 18 + ai * h;
      const area = sheet.areas.find((a) => a.id === areaId);
      const size = Math.min(34, h - 16, w - 16);
      boxes.push(
        <g key={`${ci}-${areaId}`}>
          <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={8} className="fill-surface-muted stroke-line-strong [stroke-width:1.5] [stroke-dasharray:5_4]" />
          <svg x={x + w / 2 - size / 2} y={y + h / 2 - size / 2} width={size} height={size} viewBox="0 0 24 24" className="fill-none stroke-navy [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
            {GLYPHS[areaId] ?? <circle cx="12" cy="12" r="8" />}
          </svg>
          {area && area.blocks.length > 0 && (
            <text x={x + w - 12} y={y + h - 12} textAnchor="end" fontSize={11} fontWeight={700} className="fill-ink-muted">
              {area.blocks.length}
            </text>
          )}
        </g>,
      );
    });
    x += w;
  });
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${W} ${H}`} className={`h-auto ${className}`}>
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={10} className="fill-surface stroke-navy [stroke-width:2]" />
      <rect x={pad} y={pad} width={60} height={8} rx={4} className="fill-navy" />
      {boxes}
    </svg>
  );
}
