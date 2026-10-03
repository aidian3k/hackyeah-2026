import type { ReactNode } from "react";
import type { ApiError } from "@/api/client";
import { Alert } from "@/components/Alert";
import "@/styles/components.css";

interface Props {
  loading: boolean;
  error: ApiError | null;
  onRetry?: () => void;
  /** Etykieta spinnera; domyślnie „Wczytujemy dane…”. */
  label?: string;
  children?: ReactNode;
}

/** Wczytywanie (spinner z tekstem) → błąd (alert z „Spróbuj ponownie”) → treść. */
export function LoadState({ loading, error, onRetry, label = "Wczytujemy dane…", children }: Props) {
  if (error) {
    return (
      <div role="alert">
        <Alert tone="danger" title="Nie udało się wczytać danych.">
          <p>{error.message}</p>
          {onRetry && (
            <p>
              <button type="button" className="ds-btn" onClick={onRetry}>
                Spróbuj ponownie
              </button>
            </p>
          )}
        </Alert>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="load-state" role="status">
        <span className="ds-spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }
  return <>{children}</>;
}
