import { Link } from "react-router-dom";
import { commApi } from "@/api/comm";
import { EmptyState } from "@/components/EmptyState";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { ThreadList } from "./ThreadList";

const INBOX_THREADS_N = 5;

/** Moduł 5: sekcja Skrzynki panelu — do 5 rozmów czekających na odpowiedź zespołu Hubu. */
export function CommInboxSection() {
  const waiting = useApi(
    () => commApi.listThreads({ status: "WAITING_STAFF", limit: INBOX_THREADS_N }),
    [],
  );
  return (
    <section aria-labelledby="inbox-threads" className="flex flex-col gap-4">
      <h2 id="inbox-threads" className="m-0">
        Rozmowy czekające na Hub
        {waiting.data ? ` (${waiting.data.total})` : ""}
      </h2>
      <LoadState loading={waiting.loading} error={waiting.error} onRetry={waiting.reload}>
        {waiting.data &&
          (waiting.data.items.length === 0 ? (
            <EmptyState title="Żadna rozmowa nie czeka na odpowiedź." />
          ) : (
            <ThreadList items={waiting.data.items} viewer="staff" hrefFor={(t) => `/panel/rozmowy/${t.id}`} />
          ))}
      </LoadState>
      <p className="m-0">
        <Link to="/panel/rozmowy">Wszystkie rozmowy</Link>
      </p>
    </section>
  );
}
