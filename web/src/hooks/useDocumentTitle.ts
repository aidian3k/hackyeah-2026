import { useEffect } from "react";

/** Ustawia tytuł karty przeglądarki: "<title> · ROPS Kraków". */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ROPS Kraków` : "ROPS Kraków";
  }, [title]);
}
