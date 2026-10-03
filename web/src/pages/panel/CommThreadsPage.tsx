import { useId } from "react";
import { useSearchParams } from "react-router-dom";
import { commApi, type ThreadKind, type ThreadStatus } from "@/api/comm";
import { ThreadList } from "@/components/comm/ThreadList";
import { EmptyState } from "@/components/EmptyState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { Pagination } from "@/components/Pagination";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { THREAD_KIND_LABELS, threadStatusLabel } from "@/lib/comm";
import { plural } from "@/lib/format";

const PAGE_SIZE = 20;
const STATUSES: ThreadStatus[] = ["WAITING_STAFF", "WAITING_USER", "AI_PENDING", "CLOSED"];

/** Moduł 5 — panel: lista rozmów; domyślnie te, które czekają na zespół Hubu. Filtry w URL. */
export function CommThreadsPage() {
  useDocumentTitle("Rozmowy");
  const [params, setParams] = useSearchParams();
  // „wszystkie” = brak filtra; brak parametru = domyślnie czekające na Hub
  const statusParam = params.get("status") ?? "WAITING_STAFF";
  const status = statusParam === "wszystkie" ? "" : statusParam;
  const kind = params.get("rodzaj") ?? "";
  const offset = Number(params.get("od") ?? 0) || 0;
  const statusId = useId();
  const kindId = useId();

  const threads = useApi(
    () => commApi.listThreads({ status, kind, limit: PAGE_SIZE, offset }),
    [status, kind, offset],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("od");
    setParams(next);
  }

  const total = threads.data?.total ?? 0;

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="panel" />
        <h1 tabIndex={-1} className="m-0">
          Rozmowy
        </h1>
        <p className="m-0 text-body-lg">Pytania, prośby o eksperta i propozycje partnerstwa od mieszkańców i instytucji.</p>
      </header>

      <form className="flex flex-wrap gap-4" aria-label="Filtry rozmów" onSubmit={(e) => e.preventDefault()}>
        <div className="ds-field">
          <label className="ds-label" htmlFor={statusId}>
            Status
          </label>
          <select id={statusId} className="ds-select" value={statusParam} onChange={(e) => setParam("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {threadStatusLabel(s, "staff")}
              </option>
            ))}
            <option value="wszystkie">Wszystkie</option>
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor={kindId}>
            Rodzaj
          </label>
          <select id={kindId} className="ds-select" value={kind} onChange={(e) => setParam("rodzaj", e.target.value)}>
            <option value="">Wszystkie</option>
            {(Object.keys(THREAD_KIND_LABELS) as ThreadKind[]).map((k) => (
              <option key={k} value={k}>
                {THREAD_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="ds-sr-only" aria-live="polite">
        {threads.data ? `${total} ${plural(total, "rozmowa", "rozmowy", "rozmów")}.` : ""}
      </p>

      <LoadState loading={threads.loading} error={threads.error} onRetry={threads.reload}>
        {threads.data &&
          (threads.data.items.length === 0 ? (
            <EmptyState title="Brak rozmów dla wybranych filtrów." />
          ) : (
            <>
              <ThreadList items={threads.data.items} viewer="staff" hrefFor={(t) => `/panel/rozmowy/${t.id}`} />
              <Pagination
                total={total}
                limit={PAGE_SIZE}
                offset={offset}
                onChange={(next) => {
                  const p = new URLSearchParams(params);
                  if (next) p.set("od", String(next));
                  else p.delete("od");
                  setParams(p);
                }}
              />
            </>
          ))}
      </LoadState>
    </div>
  );
}
