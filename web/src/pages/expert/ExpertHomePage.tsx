import { commApi } from "@/api/comm";
import { ThreadList } from "@/components/comm/ThreadList";
import { EmptyState } from "@/components/EmptyState";
import { ModuleLabel } from "@/components/layout/ModuleLabel";
import { LoadState } from "@/components/LoadState";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/lib/auth";

/** Moduł 5: rozmowy przydzielone zalogowanemu ekspertowi (rola `mentor`). */
export function ExpertHomePage() {
  useDocumentTitle("Moje konsultacje");
  const { session } = useAuth();
  const mentorId = session?.mentorId ?? null;
  const threads = useApi(
    () => (mentorId !== null ? commApi.listThreads({ mentor_id: mentorId, limit: 50 }) : Promise.resolve(null)),
    [mentorId],
  );

  return (
    <div className="ds-page">
      <header className="flex flex-col gap-3">
        <ModuleLabel module="komunikacja" />
        <h1 tabIndex={-1} className="m-0">
          Moje konsultacje
        </h1>
        <p className="m-0 text-body-lg">
          Rozmowy, do których zespół Hubu zaprosił Cię jako eksperta. Odpowiedź zobaczy autor pytania.
        </p>
      </header>
      {mentorId === null ? (
        <EmptyState title="To konto nie jest powiązane z profilem eksperta." />
      ) : (
        <LoadState loading={threads.loading} error={threads.error} onRetry={threads.reload}>
          {threads.data &&
            (threads.data.items.length === 0 ? (
              <EmptyState title="Nie masz przydzielonych rozmów." />
            ) : (
              <ThreadList items={threads.data.items} viewer="mentor" hrefFor={(t) => `/ekspert/rozmowy/${t.id}`} />
            ))}
        </LoadState>
      )}
    </div>
  );
}
