/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adres backendu bez końcowego `/`; pusty = ten sam origin (patrz `src/api/base.ts`). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
