import { useEffect } from "react";

/** Ustawia tytuł karty przeglądarki: "<title> · Splot". */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Splot` : "Splot";
  }, [title]);
}
