import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiError } from "@/api/client";
import type {
  BlockValue,
  CanvasBlock,
  CanvasDefinition,
  CanvasProgress,
  CanvasState,
  MultiValue,
  Partner,
} from "@/api/types";
import { completePartners } from "@/components/canvas/PartnersBlock";
import { toApiError } from "@/hooks/useApi";

/** Opóźnienie autozapisu po ostatniej zmianie bloku. */
export const CANVAS_AUTOSAVE_DELAY_MS = 800;

// lustro CANVAS_LIST_MAX_ITEMS i CANVAS_ITEM_MAX_CHARS (api/config.py)
const LIST_MAX_ITEMS = 12;
const ITEM_MAX_CHARS = 300;

let definitionPromise: Promise<CanvasDefinition> | null = null;

/** Definicja Social Canvas (GET /api/canvas/definition) — pobierana raz na sesję strony. */
export function loadCanvasDefinition(): Promise<CanvasDefinition> {
  if (!definitionPromise) {
    definitionPromise = api.canvasDefinition().catch((err: unknown) => {
      definitionPromise = null;
      throw err;
    });
  }
  return definitionPromise;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface CanvasSave {
  status: SaveStatus;
  /** Czas ostatniego udanego zapisu w tej sesji. */
  savedAt: Date | null;
  /** Błąd zapisu niezwiązany z konkretnym blokiem (sieć, serwer, 404). */
  error: ApiError | null;
}

export interface UseCanvas {
  definition: CanvasDefinition | null;
  /** Lokalny stan bloków (także niezapisane zmiany i niepełni partnerzy). */
  blocks: Record<string, BlockValue>;
  progress: CanvasProgress | null;
  updatedAt: string | null;
  loading: boolean;
  loadError: ApiError | null;
  reload(): void;
  /** Komunikaty 422 per blok (`"<block_id>: <komunikat>"` z API). */
  blockErrors: Record<string, string>;
  save: CanvasSave;
  /** Zmiana bloku: od razu lokalnie, zapis po `CANVAS_AUTOSAVE_DELAY_MS`. `null` usuwa blok. */
  setBlock(blockId: string, value: BlockValue | null): void;
  /** Zapisuje od razu wszystkie zaległe zmiany; `true`, gdy nic nie zostało niezapisane. */
  flush(): Promise<boolean>;
  /** Ustawia komunikat przy bloku bez zapisu (np. przekroczony limit przy akceptacji podpowiedzi). */
  setBlockError(blockId: string, message: string | null): void;
}

function isPartnerList(value: unknown): value is Partner[] {
  return Array.isArray(value) && value.every((x) => typeof x === "object" && x !== null);
}

/** Wartość do wysłania: partnerzy tylko pełni (K02 odrzuca niepełnych), pusta lista = usunięcie. */
function payloadValue(block: CanvasBlock | undefined, value: BlockValue | undefined): BlockValue | null {
  if (value === undefined) return null;
  if (block?.type === "partners" && isPartnerList(value)) {
    const complete = completePartners(value);
    return complete.length ? complete : null;
  }
  return value;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Czy po odpowiedzi PATCH zostawić wartość lokalną zamiast znormalizowanej z serwera.
 * Tekst różniący się tylko białymi znakami na brzegach i lista partnerów z niedokończonymi wpisami
 * zostają lokalne, żeby nie wyrywać użytkownikowi spacji ani pustego wiersza w trakcie pisania.
 */
function keepLocal(block: CanvasBlock | undefined, local: BlockValue | undefined, server: BlockValue | undefined): boolean {
  if (local === undefined) return false;
  if (block?.type === "text" && typeof local === "string") {
    return local.trim() === (typeof server === "string" ? server : "");
  }
  if (block?.type === "partners" && isPartnerList(local)) {
    if (completePartners(local).length !== local.length) return true;
    const trimmed = local.map((p) => ({ ...p, name: p.name.trim(), how: p.how.trim() }));
    return same(
      trimmed.map((p) => [p.name, p.how, [...p.roles].sort(), p.status]),
      (Array.isArray(server) ? (server as Partner[]) : []).map((p) => [p.name, p.how, [...p.roles].sort(), p.status]),
    );
  }
  return false;
}

/** Rozbija komunikat API `"<block_id>: <komunikat>"` na blok i treść. */
function splitBlockError(message: string, known: Set<string>): { blockId: string; text: string } | null {
  const i = message.indexOf(":");
  if (i <= 0) return null;
  const blockId = message.slice(0, i).trim();
  if (!known.has(blockId)) return null;
  return { blockId, text: message.slice(i + 1).trim() };
}

/**
 * Dopisuje podpowiedź asystenta jako nowy wpis bloku `list` (kolejny wpis) albo `multi` (wpis w „inne”).
 * Zwraca nową wartość albo komunikat, czemu się nie da.
 */
export function appendEntry(
  block: CanvasBlock,
  value: BlockValue | undefined,
  text: string,
): { value: BlockValue } | { error: string } {
  const entry = text.trim().slice(0, ITEM_MAX_CHARS);
  if (!entry) return { error: "Podpowiedź jest pusta." };
  if (block.type === "list") {
    const list = Array.isArray(value) ? (value as string[]).filter((x) => typeof x === "string") : [];
    if (list.includes(entry)) return { value: list };
    if (list.length >= LIST_MAX_ITEMS) return { error: `Możesz dodać najwyżej ${LIST_MAX_ITEMS} wpisów.` };
    return { value: [...list, entry] };
  }
  if (block.type === "multi") {
    const multi: MultiValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? { selected: [...(value as MultiValue).selected], other: [...(value as MultiValue).other] }
        : { selected: [], other: [] };
    if (multi.other.includes(entry)) return { value: multi };
    if (block.max !== null && block.max !== undefined && multi.selected.length + multi.other.length >= block.max) {
      return { error: `Wybierz najwyżej ${block.max}. Usuń jedną pozycję, żeby dodać podpowiedź.` };
    }
    if (multi.other.length >= LIST_MAX_ITEMS) return { error: `Możesz dopisać najwyżej ${LIST_MAX_ITEMS} własnych wpisów.` };
    return { value: { selected: multi.selected, other: [...multi.other, entry] } };
  }
  return { error: "Tę podpowiedź przepisz samodzielnie." };
}

/**
 * Stan Social Canvas pomysłu z autozapisem.
 * Zapisy idą po kolei (jeden PATCH naraz) i wysyłają tylko bloki zmienione względem ostatniego stanu z serwera.
 */
export function useCanvas(ideaId: number): UseCanvas {
  const [definition, setDefinition] = useState<CanvasDefinition | null>(null);
  const [blocks, setBlocks] = useState<Record<string, BlockValue>>({});
  const [progress, setProgress] = useState<CanvasProgress | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});
  const [save, setSave] = useState<CanvasSave>({ status: "idle", savedAt: null, error: null });
  const [tick, setTick] = useState(0);

  const defRef = useRef<Map<string, CanvasBlock>>(new Map());
  const localRef = useRef<Record<string, BlockValue>>({});
  const serverRef = useRef<Record<string, BlockValue>>({});
  const dirtyRef = useRef<Set<string>>(new Set());
  const errorRef = useRef<Set<string>>(new Set());
  const chainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const timerRef = useRef<number | null>(null);
  const ideaRef = useRef(ideaId);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Wczytanie definicji i stanu.
  useEffect(() => {
    let active = true;
    ideaRef.current = ideaId;
    dirtyRef.current = new Set();
    errorRef.current = new Set();
    setLoading(true);
    setLoadError(null);
    setBlockErrors({});
    setSave({ status: "idle", savedAt: null, error: null });
    Promise.all([loadCanvasDefinition(), api.canvas(ideaId)]).then(
      ([def, state]: [CanvasDefinition, CanvasState]) => {
        if (!active) return;
        defRef.current = new Map(def.blocks.map((b) => [b.id, b]));
        localRef.current = { ...state.blocks };
        serverRef.current = { ...state.blocks };
        setDefinition(def);
        setBlocks({ ...state.blocks });
        setProgress(state.progress);
        setUpdatedAt(state.updated_at);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setLoadError(toApiError(err));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [ideaId, tick]);

  const doFlush = useCallback(async (): Promise<boolean> => {
    const id = ideaRef.current;
    const patch: Record<string, BlockValue | null> = {};
    const sent: string[] = [];
    for (const blockId of dirtyRef.current) {
      const value = payloadValue(defRef.current.get(blockId), localRef.current[blockId]);
      if (same(value, serverRef.current[blockId])) continue;
      patch[blockId] = value;
      sent.push(blockId);
    }
    dirtyRef.current = new Set();
    const ids = sent;
    if (ids.length === 0) return true;

    if (aliveRef.current) setSave((s) => ({ ...s, status: "saving", error: null }));
    try {
      const res = await api.patchCanvas(id, { blocks: patch });
      if (ideaRef.current !== id) return false;
      serverRef.current = { ...res.blocks };
      // Plansza bierze znormalizowane wartości z odpowiedzi — poza blokami zmienionymi w trakcie zapisu.
      const next: Record<string, BlockValue> = { ...localRef.current };
      for (const blockId of new Set([...Object.keys(localRef.current), ...Object.keys(res.blocks)])) {
        // Zmieniony w trakcie zapisu (znów „brudny”) albo odrzucony z komunikatem — zostaje wartość lokalna.
        const pending = dirtyRef.current.has(blockId) || errorRef.current.has(blockId);
        const local = localRef.current[blockId];
        const server = res.blocks[blockId];
        if (pending || keepLocal(defRef.current.get(blockId), local, server)) continue;
        if (server === undefined) delete next[blockId];
        else next[blockId] = server;
      }
      localRef.current = next;
      if (aliveRef.current) {
        setBlocks({ ...next });
        setProgress(res.progress);
        setUpdatedAt(res.updated_at);
        setSave({ status: "saved", savedAt: new Date(), error: null });
      }
      return true;
    } catch (err) {
      const apiErr = toApiError(err);
      const known = new Set(ids);
      const blockErr = apiErr.status === 422 ? splitBlockError(apiErr.message, known) : null;
      if (blockErr) {
        // Błędny blok zostaje lokalnie z komunikatem; pozostałe zmiany wysyłamy jeszcze raz.
        errorRef.current.add(blockErr.blockId);
        if (aliveRef.current) setBlockErrors((e) => ({ ...e, [blockErr.blockId]: blockErr.text }));
        for (const blockId of ids) if (blockId !== blockErr.blockId) dirtyRef.current.add(blockId);
        const rest = await doFlush();
        if (aliveRef.current && rest) setSave((s) => ({ ...s, status: s.savedAt ? "saved" : "idle" }));
        return false;
      }
      for (const blockId of ids) dirtyRef.current.add(blockId);
      if (aliveRef.current) setSave((s) => ({ ...s, status: "error", error: apiErr }));
      return false;
    }
  }, []);

  const flush = useCallback((): Promise<boolean> => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const run = chainRef.current.then(doFlush, doFlush);
    chainRef.current = run;
    return run;
  }, [doFlush]);

  const setBlock = useCallback(
    (blockId: string, value: BlockValue | null) => {
      const next = { ...localRef.current };
      if (value === null) delete next[blockId];
      else next[blockId] = value;
      localRef.current = next;
      dirtyRef.current.add(blockId);
      errorRef.current.delete(blockId);
      setBlocks(next);
      setBlockErrors((e) => {
        if (!(blockId in e)) return e;
        const rest = { ...e };
        delete rest[blockId];
        return rest;
      });
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void flush();
      }, CANVAS_AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  const setBlockError = useCallback((blockId: string, message: string | null) => {
    setBlockErrors((e) => {
      const rest = { ...e };
      if (message === null) delete rest[blockId];
      else rest[blockId] = message;
      return rest;
    });
  }, []);

  // Zaległe zmiany zapisujemy przy ukryciu karty i przy wyjściu ze strony (fetch dokończy się po nawigacji w SPA).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && (dirtyRef.current.size > 0 || timerRef.current !== null)) void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size > 0 || timerRef.current !== null) {
        void flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (dirtyRef.current.size > 0 || timerRef.current !== null) void flush();
    };
  }, [flush, ideaId]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    definition,
    blocks,
    progress,
    updatedAt,
    loading,
    loadError,
    reload,
    blockErrors,
    save,
    setBlock,
    flush,
    setBlockError,
  };
}
