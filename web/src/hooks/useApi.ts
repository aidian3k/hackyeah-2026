import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/client";

export interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload(): void;
}

/** Zamienia dowolny wyjątek na ApiError (fetch rzuca już ApiError; reszta to błąd nieoczekiwany). */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, "UNKNOWN", "Coś poszło nie tak. Spróbuj ponownie.");
}

/**
 * Wywołuje `fn` przy montowaniu i przy każdej zmianie `deps`.
 * Odpowiedź nieaktualnego wywołania (zmienione deps, odmontowanie) jest ignorowana.
 * Zmiana deps czyści poprzednie dane; `reload()` zachowuje je do czasu nowej odpowiedzi.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const [tick, setTick] = useState(0);
  const lastTick = useRef(tick);
  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    const isReload = lastTick.current !== tick;
    lastTick.current = tick;
    setState((s) => ({ data: isReload ? s.data : null, error: null, loading: true }));
    fnRef.current().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (err: unknown) => {
        if (active) setState({ data: null, error: toApiError(err), loading: false });
      },
    );
    return () => {
      active = false;
    };
    // deps podaje wywołujący (jak w useEffect); fn czytamy z refa, żeby nie wymagać useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, reload };
}
