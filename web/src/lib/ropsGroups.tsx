import type { ReactNode } from "react";

/** Prefiks tagu grupy ROPS „dla kogo” — każda innowacja z Biblioteki ROPS ma dokładnie jeden taki tag. */
export const ROPS_GROUP_PREFIX = "ROPS: ";

export interface RopsGroup {
  /** Pełny tag, np. „ROPS: Dla seniorów” — wartość filtra `tag` w API. */
  tag: string;
  /** Etykieta bez prefiksu, np. „Dla seniorów”. */
  label: string;
  /** Tło paska karty i kafelka (Tailwind, kolory z presetu — w wysokim kontraście czarne). */
  surfaceClass: string;
  /** Kolor ikony na tym tle. */
  iconClass: string;
  icon: ReactNode;
}

// Ikony konturowe 24 px, obrys 2 px (styl DS), tylko dekoracja — informację niesie etykieta.
const ICONS = {
  seniors: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M19 8v13" />
      <path d="M19 8a2 2 0 0 0-2-2" />
    </>
  ),
  family: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v12h14V9" />
      <path d="M12 18s-3-1.8-3-3.6A1.6 1.6 0 0 1 12 13.5a1.6 1.6 0 0 1 3 .9c0 1.8-3 3.6-3 3.6z" />
    </>
  ),
  sensory: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  mobility: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 7v6h5l2 6" />
      <path d="M8.5 11a6 6 0 1 0 7.8 7.4" />
    </>
  ),
  intellectual: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
    </>
  ),
  health: (
    <>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </>
  ),
  foreigners: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </>
  ),
  work: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </>
  ),
  homelessness: (
    <>
      <path d="M3 21 12 4l9 17" />
      <path d="M2 21h20" />
      <path d="M12 4v17" />
      <path d="M9 21l3-6 3 6" />
    </>
  ),
  other: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

const GROUPS: RopsGroup[] = [
  { tag: "ROPS: Dla seniorów", label: "Dla seniorów", surfaceClass: "bg-soft-blue", iconClass: "text-cat-blue", icon: ICONS.seniors },
  { tag: "ROPS: Dla dzieci, młodzieży i rodziny", label: "Dla dzieci, młodzieży i rodziny", surfaceClass: "bg-soft-yellow", iconClass: "text-cat-yellow", icon: ICONS.family },
  { tag: "ROPS: Dla osób z niepełnosprawnością sensoryczną", label: "Dla osób z niepełnosprawnością sensoryczną", surfaceClass: "bg-soft-cyan", iconClass: "text-cat-cyan", icon: ICONS.sensory },
  { tag: "ROPS: Dla osób o ograniczonej mobilności", label: "Dla osób o ograniczonej mobilności", surfaceClass: "bg-soft-green", iconClass: "text-cat-green", icon: ICONS.mobility },
  { tag: "ROPS: Dla osób z niepełnosprawnością intelektualną", label: "Dla osób z niepełnosprawnością intelektualną", surfaceClass: "bg-soft-violet", iconClass: "text-violet", icon: ICONS.intellectual },
  { tag: "ROPS: Dla zdrowia i medycyny", label: "Dla zdrowia i medycyny", surfaceClass: "bg-soft-magenta", iconClass: "text-cat-magenta", icon: ICONS.health },
  { tag: "ROPS: Dla cudzoziemców", label: "Dla cudzoziemców", surfaceClass: "bg-soft-cyan", iconClass: "text-cat-cyan", icon: ICONS.foreigners },
  { tag: "ROPS: Dla rynku pracy", label: "Dla rynku pracy", surfaceClass: "bg-soft-yellow", iconClass: "text-cat-yellow", icon: ICONS.work },
  { tag: "ROPS: Dla osób w kryzysie bezdomności", label: "Dla osób w kryzysie bezdomności", surfaceClass: "bg-soft-violet", iconClass: "text-violet", icon: ICONS.homelessness },
];

const BY_TAG = new Map(GROUPS.map((g) => [g.tag, g]));

/** Grupa spoza listy (nowy tag ROPS) — neutralny wygląd, etykieta z tagu. */
function fallbackGroup(tag: string): RopsGroup {
  return {
    tag,
    label: tag.slice(ROPS_GROUP_PREFIX.length),
    surfaceClass: "bg-surface-sunken",
    iconClass: "text-navy",
    icon: ICONS.other,
  };
}

/** Grupa ROPS z listy tagów karty; null, gdy karta nie pochodzi z Biblioteki ROPS. */
export function ropsGroup(tags: string[]): RopsGroup | null {
  const tag = tags.find((t) => t.startsWith(ROPS_GROUP_PREFIX));
  if (!tag) return null;
  return BY_TAG.get(tag) ?? fallbackGroup(tag);
}

export function ropsGroupByTag(tag: string): RopsGroup | null {
  if (!tag.startsWith(ROPS_GROUP_PREFIX)) return null;
  return BY_TAG.get(tag) ?? fallbackGroup(tag);
}

/** Wygląd dla kart bez grupy (wiedza, zgłoszenia użytkowników). */
export const NEUTRAL_VISUAL = { surfaceClass: "bg-surface-sunken", iconClass: "text-navy", icon: ICONS.other };

/** Nazwa projektu z tagu „Projekt: …” (inkubatory ROPS); null, gdy brak. */
export function projectName(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("Projekt: "));
  return tag ? tag.slice("Projekt: ".length) : null;
}

export function GroupIcon({ group, className }: { group: { iconClass: string; icon: ReactNode }; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${group.iconClass} ${className ?? ""}`.trim()}
    >
      {group.icon}
    </svg>
  );
}
