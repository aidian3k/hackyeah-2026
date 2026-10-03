import { useEffect, useRef } from "react";

/**
 * Wywołuje `fn` co `ms` milisekund. Gdy karta jest ukryta (document.hidden), odliczanie stoi;
 * po powrocie na kartę `fn` wywołuje się od razu i odliczanie startuje od nowa.
 * Pierwszego wywołania przy montowaniu nie ma — dane początkowe ładuje wywołujący (np. useApi).
 */
export function usePolling(fn: () => void, ms: number): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(() => fnRef.current(), ms);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fnRef.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ms]);
}
