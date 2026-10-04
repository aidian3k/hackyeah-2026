import type { ThreadStatus as Status } from "@/api/comm";
import { threadStatusLabel, type Viewer } from "@/lib/comm";

/** Status rozmowy słownie (nie tylko kolorem). */
export function ThreadStatus({ status, viewer }: { status: Status; viewer: Viewer }) {
  return (
    <span className="ds-tag">
      <span className="ds-sr-only">Status: </span>
      {threadStatusLabel(status, viewer)}
    </span>
  );
}
