import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { SimilarReport } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { formatDate, plural } from "@/lib/format";

/** Długość skrótu zgłoszenia w tabeli (znaki). */
const EXCERPT_CHARS = 140;

function excerpt(text: string): string {
  const chars = [...text.trim()];
  return chars.length > EXCERPT_CHARS ? `${chars.slice(0, EXCERPT_CHARS).join("").trimEnd()}…` : chars.join("");
}

/** Dopasowanie zgłoszenia: ikona + słowo (kolor nie jest jedyną informacją). */
export function MatchLabel({ matched }: { matched: boolean }) {
  return (
    <span className="ds-cluster">
      <svg
        viewBox="0 0 24 24"
        width="1.25em"
        height="1.25em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10" />
        {matched ? (
          <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
        ) : (
          <>
            <line x1="12" y1="7" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
      </svg>
      <span>{matched ? "Dopasowane" : "Bez dopasowania"}</span>
    </span>
  );
}

/** „{n} podobnych zgłoszeń z {m} gmin” — m to liczba różnych podanych gmin. */
export function scaleSummary(items: SimilarReport[]): string {
  const n = items.length;
  const gminy = new Set(items.map((r) => r.gmina).filter((g): g is string => Boolean(g))).size;
  const reports = `${n} ${plural(n, "podobne zgłoszenie", "podobne zgłoszenia", "podobnych zgłoszeń")}`;
  if (gminy === 0) return `${reports}, bez podanej gminy.`;
  return `${reports} z ${gminy} ${plural(gminy, "gminy", "gmin", "gmin")}.`;
}

interface Props {
  reportId: number;
}

/** Podobne zgłoszenia (powyżej progu podobieństwa backendu) — pokazują skalę problemu. */
export function SimilarReports({ reportId }: Props) {
  const { data, error, loading, reload } = useApi(() => api.similarReports(reportId), [reportId]);
  const headingId = "podobne-zgloszenia";
  const count = data?.length ?? null;

  return (
    <section className="ds-stack" aria-labelledby={headingId}>
      <h2 id={headingId}>Podobne zgłoszenia{count !== null && ` (${count})`}</h2>
      <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy podobne zgłoszenia…">
        {data &&
          (data.length === 0 ? (
            <EmptyState title="Nie ma podobnych zgłoszeń.">
              <p>To zgłoszenie jest na razie jedyne w swoim rodzaju.</p>
            </EmptyState>
          ) : (
            <>
              <p>
                <strong>{scaleSummary(data)}</strong>
              </p>
              {/* Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu). */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <div className="ds-table-wrap" role="region" aria-label="Tabela podobnych zgłoszeń" tabIndex={0}>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th scope="col">Zgłoszenie</th>
                      <th scope="col">Treść (skrót)</th>
                      <th scope="col">Gmina</th>
                      <th scope="col">Data</th>
                      <th scope="col">Dopasowanie</th>
                      <th scope="col" className="ds-table__num">
                        Podobieństwo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.id}>
                        <th scope="row">
                          <Link to={`/panel/zgloszenia/${r.id}`}>Zgłoszenie nr {r.id}</Link>
                        </th>
                        <td>{excerpt(r.raw_text)}</td>
                        <td>{r.gmina ?? "Nie podano"}</td>
                        <td>
                          <time dateTime={r.created_at}>{formatDate(r.created_at)}</time>
                        </td>
                        <td>
                          <MatchLabel matched={r.matched} />
                        </td>
                        <td className="ds-table__num">podobieństwo {Math.round(r.similarity * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </LoadState>
    </section>
  );
}
