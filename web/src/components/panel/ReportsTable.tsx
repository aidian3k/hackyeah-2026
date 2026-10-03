import { Link } from "react-router-dom";
import type { ReportListItem } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";
import { StatusLabel } from "@/components/panel/StatusControl";
import { formatDate, formatDateTime } from "@/lib/format";
import { REPORTER_TYPE_LABELS } from "@/lib/labels";
import "@/styles/panel-reports.css";

const EXCERPT_CHARS = 140;

/** Skrót treści do 140 znaków, cięty na granicy słowa. */
function excerpt(text: string, max = EXCERPT_CHARS): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Status dopasowania: ikona + słowo (kolor nie jest jedyną informacją). */
function MatchStatus({ matched }: { matched: boolean }) {
  return (
    <span className={`match-status match-status--${matched ? "yes" : "no"}`}>
      <svg className="match-status__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {matched ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
          </>
        ) : (
          <>
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
      </svg>
      {matched ? "Dopasowano" : "Bez dopasowania"}
    </span>
  );
}

/** Etykieta kolumny widoczna tylko w układzie kart (wąski ekran); w tabeli robi to nagłówek. */
function CellLabel({ children }: { children: string }) {
  return (
    <span className="reports-table__label" aria-hidden="true">
      {children}
    </span>
  );
}

interface Props {
  items: ReportListItem[];
  /** Opis filtra w podpisie tabeli. */
  caption: string;
}

/**
 * Tabela zgłoszeń panelu. Poniżej ~700 px ten sam znacznik układa się jako lista kart (CSS),
 * Etykiety komórek w kartach są aria-hidden: semantykę (nagłówki kolumn) daje tabela.
 */
export function ReportsTable({ items, caption }: Props) {
  return (
    // Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="ds-table-wrap reports-table-wrap" role="region" aria-labelledby="reports-caption" tabIndex={0}>
      <table className="ds-table reports-table">
        <caption id="reports-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">
              Zgłoszenie
            </th>
            <th scope="col">
              Wyzwanie
            </th>
            <th scope="col">
              Gmina
            </th>
            <th scope="col">
              Zgłaszający
            </th>
            <th scope="col">
              Dopasowanie
            </th>
            <th scope="col">
              Status
            </th>
            <th scope="col" className="ds-table__num">
              Odpowiedzi
            </th>
            <th scope="col">
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td className="reports-table__text">
                <Link to={`/panel/zgloszenia/${r.id}`}>{excerpt(r.raw_text)}</Link>
                <span className="reports-table__id">nr {r.id}</span>
              </td>
              <td>
                <CellLabel>Wyzwanie</CellLabel>
                <span>
                  {r.category && r.category_label_pl ? (
                    <CategoryTag code={r.category} label={r.category_label_pl} />
                  ) : (
                    "Nie przypisano"
                  )}
                </span>
              </td>
              <td>
                <CellLabel>Gmina</CellLabel>
                <span>
                  {r.gmina ?? "Nie podano"}
                  {r.gmina && r.powiat && <span className="reports-table__muted"> (pow. {r.powiat})</span>}
                </span>
              </td>
              <td>
                <CellLabel>Zgłaszający</CellLabel>
                <span>{REPORTER_TYPE_LABELS[r.reporter_type] ?? r.reporter_type}</span>
              </td>
              <td>
                <CellLabel>Dopasowanie</CellLabel>
                <MatchStatus matched={r.matched} />
              </td>
              <td>
                <CellLabel>Status</CellLabel>
                <StatusLabel status={r.status} />
              </td>
              <td className="ds-table__num">
                <CellLabel>Odpowiedzi</CellLabel>
                <span>{r.reply_count}</span>
              </td>
              <td>
                <CellLabel>Data</CellLabel>
                <time dateTime={r.created_at} title={formatDateTime(r.created_at)}>
                  {formatDate(r.created_at)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
