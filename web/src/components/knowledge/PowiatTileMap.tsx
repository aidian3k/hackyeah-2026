import { useId, useMemo, useState, type CSSProperties } from "react";
import { api } from "@/api/client";
import type { IndicatorDetail, IndicatorMeta } from "@/api/types";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import {
  COL_START,
  MAP_SCALE_STEPS,
  POWIAT_TILES,
  ROW_START,
  STEP_CLASSES,
  STEP_LABELS,
  quantileThresholds,
  scaleStep,
} from "@/lib/powiatTiles";
import { DemoTag } from "./DemoTag";

const numberFmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

function formatValue(value: number, unit: string): string {
  return unit === "%" ? `${numberFmt.format(value)} %` : `${numberFmt.format(value)} ${unit}`;
}

interface Props {
  /** Wskaźniki do wyboru; pierwszy jest domyślny. Pusta lista → nic nie renderujemy. */
  indicators: IndicatorMeta[];
}

function MapBody({ detail }: { detail: IndicatorDetail }) {
  const [descending, setDescending] = useState(true);
  const analysis = useMemo(() => {
    const thresholds = quantileThresholds(detail.values.map((v) => v.value), MAP_SCALE_STEPS);
    const withStep = detail.values.map((v) => ({
      ...v,
      step: scaleStep(v.value, thresholds, detail.higher_is_worse),
    }));
    // Przedziały legendy z faktycznych wartości w stopniu (od najjaśniejszego stopnia do najciemniejszego).
    const ranges = Array.from({ length: MAP_SCALE_STEPS }, (_, step) => {
      const inStep = withStep.filter((v) => v.step === step).map((v) => v.value);
      return inStep.length > 0 ? { step, min: Math.min(...inStep), max: Math.max(...inStep) } : null;
    });
    // Kolejność wizualna na telefonie: od najgorszych do najlepszych.
    const rankByPowiat = new Map(
      [...withStep]
        .sort((a, b) => (detail.higher_is_worse ? b.value - a.value : a.value - b.value) || a.powiat.localeCompare(b.powiat, "pl"))
        .map((v, i) => [v.powiat, i] as const),
    );
    return { withStep, ranges, rankByPowiat };
  }, [detail]);

  const alphabetical = [...analysis.withStep].sort((a, b) => a.powiat.localeCompare(b.powiat, "pl"));
  const sortedRows = [...analysis.withStep].sort((a, b) => (descending ? b.value - a.value : a.value - b.value));

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-ink">
        <span>
          {detail.label_pl}, {detail.year}
          {detail.region_value !== null && <> · województwo: {formatValue(detail.region_value, detail.unit)}</>}
        </span>
        {detail.is_demo && <DemoTag />}
      </p>

      <ul className="m-0 flex list-none flex-col gap-1 p-0 sm:grid sm:grid-cols-6 sm:gap-2" aria-label={detail.label_pl}>
        {alphabetical.map((v) => {
          const pos = POWIAT_TILES[v.powiat];
          return (
            <li
              key={v.powiat}
              style={{ "--tile-order": analysis.rankByPowiat.get(v.powiat) ?? 0 } as CSSProperties}
              className={`flex min-h-[64px] flex-col justify-center gap-1 rounded-md px-3 py-2 [order:var(--tile-order)] [overflow-wrap:anywhere] sm:[order:0] ${
                STEP_CLASSES[v.step]
              } ${pos ? `${COL_START[pos.col]} ${ROW_START[pos.row]}` : ""}`}
            >
              <span className="text-small">
                {v.powiat}
                <span className="ds-sr-only">, </span>
              </span>
              <span className="font-sans text-body font-bold">{formatValue(v.value, detail.unit)}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <p className="m-0 font-sans text-label text-ink">Skala: powiaty podzielone na cztery równe grupy</p>
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-small text-ink">
          {analysis.ranges.map((r) =>
            r ? (
              <li key={r.step} className="flex items-center gap-2">
                <span aria-hidden="true" className={`inline-block h-4 w-4 rounded-sm ${STEP_CLASSES[r.step]}`} />
                <span>
                  {numberFmt.format(r.min)}–{numberFmt.format(r.max)} {detail.unit} ({STEP_LABELS[r.step]})
                </span>
              </li>
            ) : null,
          )}
        </ul>
        <p className="m-0 text-small text-ink-muted">
          Kolor jest dodatkiem — wartości podajemy też liczbą. Małymi literami są powiaty; Kraków, Nowy Sącz i Tarnów
          to miasta na prawach powiatu.{" "}
          {detail.higher_is_worse ? "Ciemniejszy kolor: wyższa wartość." : "Ciemniejszy kolor: niższa wartość."}
        </p>
        <p className="m-0 text-small text-ink-muted">
          Źródło:{" "}
          {detail.source_url ? (
            <a href={detail.source_url} target="_blank" rel="noopener noreferrer">
              {detail.source_name}
              <span className="ds-sr-only"> (otwiera się w nowej karcie)</span>
            </a>
          ) : (
            detail.source_name
          )}
        </p>
      </div>

      <details>
        <summary>Pokaż jako tabelę</summary>
        {/* Przewijany region musi być osiągalny klawiaturą (wzorzec ds-table-wrap z design systemu). */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="ds-table-wrap" role="region" aria-labelledby={`tbl-${detail.code}`} tabIndex={0}>
          <table className="ds-table">
            <caption id={`tbl-${detail.code}`}>
              {detail.label_pl} według powiatów, {detail.year}
            </caption>
            <thead>
              <tr>
                <th scope="col">Powiat</th>
                <th scope="col" className="ds-table__num" aria-sort={descending ? "descending" : "ascending"}>
                  <button type="button" className="ds-btn ds-btn--link px-0" onClick={() => setDescending((d) => !d)}>
                    Wartość ({detail.unit}) {descending ? "↓" : "↑"}
                    <span className="ds-sr-only">, zmień kolejność sortowania</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((v) => (
                <tr key={v.powiat}>
                  <th scope="row">{v.powiat}</th>
                  <td className="ds-table__num">{numberFmt.format(v.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** Mapa kafelkowa powiatów z wyborem wskaźnika; dane z `GET /api/indicators/{code}`. */
export function PowiatTileMap({ indicators }: Props) {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const code = selected && indicators.some((i) => i.code === selected) ? selected : indicators[0]?.code;
  const { data, error, loading, reload } = useApi(
    () => (code ? api.indicator(code) : Promise.reject(new Error("brak wskaźnika"))),
    [code],
  );
  if (indicators.length === 0 || !code) return null;

  return (
    <div className="flex flex-col gap-4">
      {indicators.length > 1 && (
        <div className="ds-field max-w-xl">
          <label className="ds-label" htmlFor={`${id}-indicator`}>
            Wskaźnik
          </label>
          <select
            id={`${id}-indicator`}
            className="ds-select"
            value={code}
            onChange={(e) => setSelected(e.target.value)}
          >
            {indicators.map((i) => (
              <option key={i.code} value={i.code}>
                {i.label_pl} ({i.year})
              </option>
            ))}
          </select>
        </div>
      )}
      <LoadState loading={loading} error={error} onRetry={reload} label="Wczytujemy mapę…">
        {data && <MapBody detail={data} />}
      </LoadState>
    </div>
  );
}
