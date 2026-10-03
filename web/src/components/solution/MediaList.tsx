import type { ReactNode } from "react";
import type { MediaItem } from "@/api/types";
import "@/styles/solution.css";

interface Props {
  /** Materiały bez filmów osadzonych na stronie (te pokazuje VideoEmbed). */
  items: MediaItem[];
}

const FALLBACK_TITLES: Record<string, string> = {
  materials: "Pobierz materiały",
  document: "Przeczytaj dokument",
  license: "Sprawdź zasady wykorzystania",
  video: "Zobacz film",
};

const FILE_TYPES = new Set([
  "zip", "rar", "7z", "pdf", "doc", "docx", "odt", "rtf", "txt",
  "xls", "xlsx", "ods", "csv", "ppt", "pptx", "odp", "jpg", "jpeg", "png", "mp3", "mp4",
]);

/** „(plik ZIP)”, gdy typ wynika z rozszerzenia w adresie; inaczej null. */
function fileTypeLabel(url: string): string | null {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  const m = /\.([a-z0-9]{2,4})$/i.exec(path);
  const ext = m?.[1]?.toLowerCase();
  if (!ext) return null;
  return FILE_TYPES.has(ext) ? `plik ${ext.toUpperCase()}` : null;
}

// Ikony konturowe 2 px (obrys w kolorze tekstu linku), dekoracyjne.
const ICONS: Record<string, ReactNode> = {
  materials: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </>
  ),
  license: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="12" y1="7" x2="12.01" y2="7" />
    </>
  ),
  video: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
};

/** „Materiały”: pliki, dokumenty, licencje jako linki z ikoną i tytułem. Pusta lista → nic. */
export function MediaList({ items }: Props) {
  const links = items.filter((m) => m.url && /^https?:\/\//i.test(m.url));
  if (links.length === 0) return null;
  return (
    <ul className="media-list">
      {links.map((m, i) => {
        const title = m.title?.trim() || FALLBACK_TITLES[m.type] || "Otwórz materiał";
        const fileType = fileTypeLabel(m.url);
        return (
          <li key={`${m.url}-${i}`}>
            <a className="media-list__link" href={m.url}>
              <svg
                className="media-list__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {ICONS[m.type] ?? ICONS.link}
              </svg>
              <span>
                {title}
                {fileType && <span className="media-list__type"> ({fileType})</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
