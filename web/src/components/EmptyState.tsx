import type { ReactNode } from "react";
import "@/styles/components.css";

interface Props {
  title: string;
  /** Jedno zdanie pomocy (np. co zmienić w filtrach). */
  children?: ReactNode;
}

export function EmptyState({ title, children }: Props) {
  return (
    <div className="empty-state ds-stack">
      <p className="empty-state__title">{title}</p>
      {children && <div className="empty-state__body">{children}</div>}
    </div>
  );
}
