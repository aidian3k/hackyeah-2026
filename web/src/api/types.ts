// Lustro api/schemas.py (kontrakt F01 w docs/modules/01-matchmaking/frontend-tasks.md). Daty przychodzą jako ciągi ISO.

export type ReporterType = "RESIDENT" | "NGO" | "JST" | "OTHER";
export type ReportStatus = "NEW" | "TRIAGED" | "MATCHED" | "IN_PROGRESS" | "CLOSED";
export type SolutionKind = "SOLUTION" | "KNOWLEDGE";
export type SolutionStatus = "PUBLISHED" | "PENDING_REVIEW" | "REJECTED" | "ARCHIVED";
export type Stage = "preprocess" | "search" | "rerank" | "answer";

export interface Scores {
  rerank: number | null; rrf: number | null;
  lex_rank: number | null; vec_rank: number | null; cosine: number | null;
}
export interface MediaItem { type: string; url: string; title: string | null }   // type w korpusie: video | materials | document | license

export interface SolutionCard {
  id: number; kind: SolutionKind; rank: number;
  title: string; summary: string;
  organization: string | null; gmina: string | null; powiat: string | null;
  category: string | null; category_label_pl: string | null;
  tags: string[]; target_group: string | null; cost_range: string | null;
  implementation_steps: string[];
  source_url: string | null; source_name: string | null;
  evidence_level: number;            // 1–5
  media: MediaItem[];
  origin: string;                    // CURATED | USER_SUBMITTED | PROMOTED_FROM_REPORT
  scores: Scores | null;             // null poza wynikami czatu/wyszukiwania
}
export interface SolutionDetail extends SolutionCard { body: string }

// --- czat (SSE) ---
export interface ChatRequest {
  message: string;                   // 1..10000 znaków, nie same spacje
  session_id?: string | null;
  gmina?: string | null;             // nazwa z /api/gminy; nieznana → 422 przed strumieniem
  severity_self?: number | null;     // 1–5
  reporter_type?: ReporterType;      // domyślnie OTHER
}
export interface StatusEvent { stage: Stage; label_pl: string }
export interface CandidatesEvent { solutions: SolutionCard[]; also_see: SolutionCard[]; context: SolutionCard[] }
export interface TokenEvent { text: string }
export interface AnswerRetractedEvent { reason: "no_citations" }
export interface NoMatchEvent { reason: "below_threshold"; best_score: number | null; gate: string; message_pl: string }
export interface ReportSavedEvent { report_id: number; similar_count: number; gmina_count: number }
export interface DoneEvent { search_event_id: number | null; latency_ms: Record<string, number> }
export interface ErrorEvent { code: string; message_pl: string }

export type ChatEvent =
  | { event: "status"; data: StatusEvent }
  | { event: "candidates"; data: CandidatesEvent }
  | { event: "token"; data: TokenEvent }
  | { event: "answer_retracted"; data: AnswerRetractedEvent }
  | { event: "no_match"; data: NoMatchEvent }
  | { event: "report_saved"; data: ReportSavedEvent }
  | { event: "done"; data: DoneEvent }
  | { event: "error"; data: ErrorEvent };

// --- zgłoszenia i panel ---
export interface Page<T> { items: T[]; total: number; limit: number; offset: number }
export interface ReportListItem {
  id: number; raw_text: string;
  category: string | null; category_label_pl: string | null;
  gmina: string | null; powiat: string | null;
  reporter_type: ReporterType; severity_self: number | null;
  matched: boolean; status: ReportStatus;
  top_solution_id: number | null; top_rerank_score: number | null;
  session_id: string | null; created_at: string; reply_count: number;
}
export interface ReportDetail extends ReportListItem {
  normalized_text: string; target_group: string | null; extracted: Record<string, unknown>;
}
export interface SimilarReport { id: number; raw_text: string; gmina: string | null; created_at: string; matched: boolean; similarity: number }
export interface ReplyCreate { body: string; author_label?: string | null }   // body 1..4000
export interface Reply { id: number; report_id: number; author_label: string | null; body: string; created_at: string; author_verified: false }

// --- rozwiązania ---
export interface SolutionSubmit {
  title: string;                     // 3..200
  summary: string;                   // 10..2000
  body?: string;                     // ..20000
  organization?: string | null; gmina?: string | null; category?: string | null;
  tags?: string[];                   // ≤ 20
  target_group?: string | null; cost_range?: string | null;
  implementation_steps?: string[];   // ≤ 30
  source_url?: string | null; media?: MediaItem[];
  submitted_by_name?: string | null;
}                                    // extra="forbid": nie wysyłaj innych pól
export interface SolutionCreated { id: number; status: "PENDING_REVIEW" }
export interface SolutionPatch { status?: "PUBLISHED" | "REJECTED" | "ARCHIVED"; evidence_level?: number; category?: string }

// --- skrzynka, statystyki, meta ---
export interface Inbox {
  new_reports: number; new_unmatched: number; pending_solutions: number;
  latest_reports: ReportListItem[]; latest_pending: SolutionCard[];
}
interface Counts { total: number; matched: number; unmatched: number }
export interface Stats extends Counts {
  from: string; to: string;
  by_category: (Counts & { category: string | null; label_pl: string | null })[];
  by_gmina: (Counts & { gmina: string | null; powiat: string | null })[];
  by_week: (Counts & { week: string })[];
  by_reporter_type: (Counts & { reporter_type: ReporterType })[];
}
export interface FeedbackCreate { search_event_id: number; solution_id?: number | null; helpful: boolean }
export interface TaxonomyItem { code: string; label_pl: string; description: string; sort_order: number }
export interface GminaItem { name: string; powiat: string }
export interface Health { db: "ok" | "error"; embedding_provider: string; rerank_provider: string; llm_enabled: boolean }
export interface ErrorBody { error: { code: string; message: string } }
