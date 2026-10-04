/**
 * Adres backendu — jedyne miejsce, które go zna.
 *
 * Pusty (domyślnie) = ten sam origin co frontend: proxy Vite w dev, nginx w `make up`,
 * CloudFront z zachowaniem `/api/*` na AWS. Ustaw `VITE_API_BASE_URL` (np. `http://1.2.3.4:8000`
 * w `web/.env.production.local`), gdy frontend woła backend bezpośrednio — wtedy origin frontendu
 * musi być w `CORS_ORIGINS` backendu. Wartość jest wkompilowana przy `npm run build`.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

/** `"/api/taxonomy"` → `"<API_BASE_URL>/api/taxonomy"`. */
export function apiUrl(path: string): string {
  return API_BASE_URL + path;
}
