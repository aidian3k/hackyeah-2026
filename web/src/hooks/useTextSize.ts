import { useCallback, useState } from "react";
import { setTextSize as saveTextSize, type TextSize } from "@/lib/storage";

const ATTR = "data-text-size";

function readTextSize(): TextSize {
  const v = document.documentElement.getAttribute(ATTR);
  return v === "large" || v === "xlarge" ? v : "normal";
}

/**
 * Rozmiar tekstu (A / A+ / A++). Stan początkowy czyta z <html data-text-size>,
 * który ustawia skrypt inline w index.html; skalowanie robi reguła w design-system/components.css.
 */
export function useTextSize(): [TextSize, (size: TextSize) => void] {
  const [size, setSize] = useState<TextSize>(readTextSize);

  const set = useCallback((next: TextSize) => {
    if (next === "normal") document.documentElement.removeAttribute(ATTR);
    else document.documentElement.setAttribute(ATTR, next);
    saveTextSize(next);
    setSize(next);
  }, []);

  return [size, set];
}
