import { useCallback, useState } from "react";
import { setContrast as saveContrast } from "@/lib/storage";

const ATTR = "data-contrast";

function readContrast(): boolean {
  return document.documentElement.getAttribute(ATTR) === "high";
}

/**
 * Tryb wysokiego kontrastu. Stan początkowy czyta z <html data-contrast>,
 * który ustawia skrypt inline w index.html (bez mignięcia jasnego motywu).
 */
export function useContrast(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState<boolean>(readContrast);

  const set = useCallback((next: boolean) => {
    if (next) document.documentElement.setAttribute(ATTR, "high");
    else document.documentElement.removeAttribute(ATTR);
    saveContrast(next);
    setOn(next);
  }, []);

  return [on, set];
}
