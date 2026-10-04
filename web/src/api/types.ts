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

// --- Moduł 4: Tester innowacji ---
export type MaterialType = "FILE" | "LINK" | "APP" | "INSTRUCTION" | "OFFLINE_SERVICE";
export type TesterType =
  | "RESIDENT"
  | "TARGET_MEMBER"
  | "CAREGIVER"
  | "NGO"
  | "JST"
  | "SOCIAL_INSTITUTION"
  | "OTHER";
export type TestMode = "ONLINE" | "OFFLINE" | "HYBRID";
export type InnovationTestStatus = "OPEN" | "CLOSED";
export type ApplicationStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELED";

export interface InnovationTestMaterial {
  id: number;
  title: string;
  type: MaterialType;
  locator: string;
  description: string;
  sort_order: number;
}
export interface InnovationTestMaterialIn {
  title: string;
  type: MaterialType;
  locator: string;
  description?: string;
  sort_order?: number;
}
export interface InnovationTest {
  id: number;
  solution_id: number;
  solution_title: string | null;
  solution_status: string | null;
  title: string;
  goal_description: string;
  instruction: string;
  target_group: string;
  tester_type: string;
  location: string;
  seats_limit: number;
  seats_accepted: number;
  mode: TestMode;
  estimated_duration: string;
  ends_at: string;
  status: InnovationTestStatus;
  created_at: string;
  closed_at: string | null;
  materials: InnovationTestMaterial[];
}
export interface InnovationTestCreate {
  solution_id: number;
  title: string;
  goal_description: string;
  instruction: string;
  target_group: string;
  tester_type: string;
  location: string;
  seats_limit: number;
  mode: TestMode;
  estimated_duration: string;
  ends_at: string;
  materials: InnovationTestMaterialIn[];
}
export interface InnovationTestApplicationCreate {
  display_name: string;
  email: string;
  tester_type: TesterType;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  is_target_group_member: boolean;
  motivation: string;
  consent: true;
}
export interface InnovationTestApplicationPublic {
  id: number;
  test_id: number;
  status: ApplicationStatus;
  consent_version: string;
  message_pl: string;
}
export interface TesterFitSuggestion {
  label_pl: string;
  rationale_pl: string;
  disclaimer_pl: string;
}
export interface InnovationTestApplication {
  id: number;
  test_id: number;
  display_name: string;
  email: string;
  tester_type: TesterType;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  is_target_group_member: boolean;
  motivation: string;
  status: ApplicationStatus;
  consent: boolean;
  consent_version: string;
  consented_at: string;
  rejection_reason: string | null;
  cancel_reason: string | null;
  has_access_token: boolean;
  ai_fit_suggestion: TesterFitSuggestion | null;
  created_at: string;
  updated_at: string;
  feedback_id: number | null;
}
export interface InnovationTestAccessLink {
  application_id: number;
  status: ApplicationStatus;
  access_token: string;
  access_path: string;
}
export interface InnovationTestFeedback {
  id: number;
  application_id: number;
  usefulness: number;
  ease_of_use: number;
  accessibility: number;
  fit_to_needs: number;
  comment: string | null;
  improvement: string | null;
  comment_visible_to_author: boolean;
  submitted_at: string;
}
export interface InnovationTestFeedbackCreate {
  usefulness: number;
  ease_of_use: number;
  accessibility: number;
  fit_to_needs: number;
  comment?: string | null;
  improvement?: string | null;
}
export interface InnovationTestAccessStatus {
  application_id: number;
  test_id: number;
  test_title: string;
  test_status: InnovationTestStatus;
  status: ApplicationStatus;
  rejection_reason: string | null;
  cancel_reason: string | null;
  can_submit_feedback: boolean;
  feedback: InnovationTestFeedback | null;
}
export interface RatingStats {
  average: number | null;
  distribution: { score: number; count: number }[];
}
export interface AiTestReport {
  summary_pl: string;
  barriers_pl: string[];
  improvements_pl: string[];
  evidence_feedback_ids: number[];
  disclaimer_pl: string;
}
export interface InnovationTestReport {
  test_id: number;
  test_status: InnovationTestStatus;
  applications_total: number;
  applications_accepted: number;
  applications_completed: number;
  applications_canceled: number;
  applications_rejected: number;
  applications_submitted: number;
  feedback_count: number;
  small_sample_warning: boolean;
  usefulness: RatingStats;
  ease_of_use: RatingStats;
  accessibility: RatingStats;
  fit_to_needs: RatingStats;
  anonymous_comments: {
    feedback_id: number;
    comment: string | null;
    improvement: string | null;
    comment_visible_to_author: boolean;
    usefulness: number;
    ease_of_use: number;
    accessibility: number;
    fit_to_needs: number;
  }[];
  ai_report: AiTestReport | null;
  ai_available: boolean;
  ai_error_pl: string | null;
  ai_model: string | null;
  ai_prompt_version: string | null;
  ai_generated_at: string | null;
}
export interface ConsentMeta { version: string; text_pl: string }

// --- Moduł 3: Kreator pomysłów (lustro api/kreator/schemas.py; daty jako ciągi ISO) ---
export type IdeaStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "INVITED" | "REJECTED";
export type IdeaStage = "IDEA" | "PROTOTYPE" | "TESTED" | "READY";
/** Statusy, które może ustawić Hub (POST /api/ideas/{id}/status). */
export type IdeaHubStatus = Exclude<IdeaStatus, "DRAFT">;
export type CanvasBlockType = "single" | "multi" | "list" | "text" | "partners";
export type AssistTarget = "idea" | "canvas_block";
export type CallSectionKind = "text" | "info" | "budget" | "total";   // budget — tabela kosztów etapów, total — wnioskowana kwota
export type BudgetPhase = "prep" | "test_1" | "test_2";              // okres przygotowawczy, faza I i II testu
export type CallState = "open" | "closed" | "upcoming";

export interface IdeaCreate {
  title: string;                     // 3..200
  summary: string;                   // 10..2000
  essence?: string;                  // ..2000
  audience?: string;                 // ..1000
  stage?: IdeaStage;                 // domyślnie IDEA
  category?: string | null;
  gmina?: string | null;
  author_name?: string | null;       // ..100
  contact_email?: string | null;     // ..320, nigdy nie wraca z API
  source_report_id?: number | null;
}
export type IdeaUpdate = Partial<Omit<IdeaCreate, "source_report_id">>;
export interface IdeaListItem {
  id: number; title: string; summary: string;
  stage: IdeaStage; status: IdeaStatus;
  category: string | null; category_label_pl: string | null;
  gmina: string | null; powiat: string | null; author_name: string | null;
  has_contact: boolean; source_report_id: number | null;
  canvas_percent: number; reply_count: number;
  created_at: string; updated_at: string; submitted_at: string | null;
}
export interface IdeaApplicationRef { id: number; call_id: string; updated_at: string }
export interface IdeaDetail extends IdeaListItem {
  essence: string; audience: string;
  applications: IdeaApplicationRef[];
}
export interface IdeaStatusChange { status: IdeaHubStatus }
export interface IdeaReply {
  id: number; idea_id: number; author_label: string | null;
  body: string; created_at: string; author_verified: false;
}

// kanwa: definicja (data/social-canvas.json)
export interface CanvasOption { code: string; label: string; description: string; level: number | null }
export interface CanvasRole { code: string; label: string; description: string }
export interface CanvasStatus { code: string; label: string }
export interface CanvasBlock {
  id: string; sheet: string; area: string; type: CanvasBlockType;
  title: string; prompt: string; help: string[]; max: number | null;
  options: CanvasOption[]; roles: CanvasRole[]; statuses: CanvasStatus[];
}
export interface CanvasArea { id: string; title: string; blocks: string[] }
export interface CanvasSheet { id: string; title: string; areas: CanvasArea[] }
export interface CanvasDefinition {
  version: string; source_pl: string; source_url: string;
  sheets: CanvasSheet[]; blocks: CanvasBlock[];
}

// kanwa: wartości bloków (idea_canvases.data[block_id])
export interface MultiValue { selected: string[]; other: string[] }
export interface Partner { name: string; how: string; roles: string[]; status: string }
/** single/text → string, list → string[], multi → MultiValue, partners → Partner[]. */
export type BlockValue = string | string[] | MultiValue | Partner[];

// kanwa: postęp, stan, zapis
export interface SheetProgress { filled: number; total: number }
export interface CanvasProgress { filled: number; total: number; percent: number; by_sheet: Record<string, SheetProgress> }
export interface CanvasState {
  idea_id: number; blocks: Record<string, BlockValue>;
  progress: CanvasProgress; updated_at: string | null;
}
/** Wartość `null` usuwa blok. */
export interface CanvasPatch { blocks: Record<string, BlockValue | null> }

// asystent i podobne innowacje
export interface AssistRequest { target: AssistTarget; block_id?: string | null }
export interface AssistSuggestion { field: string; value: string; rationale: string }
export interface AssistResponse {
  available: boolean; questions: string[]; suggestions: AssistSuggestion[];
  message_pl: string | null;
}
export interface SimilarResponse {
  available: boolean; matched: boolean; solutions: SolutionCard[];
  message_pl: string | null;
}

// nabory (data/calls/<id>.json)
export interface CallSection {
  id: string; title: string; kind: CallSectionKind; prompt: string;
  hints: string[]; required: boolean; max_chars: number | null;
  prefill: string[];                 // "idea.<pole>" / "canvas.<block_id>"
  // układ wzoru formularza (feature-2026-10-04-3)
  number: string | null;             // numer punktu we wzorze; null = podpunkt
  form_prompt: string | null;        // instrukcja na wydruku, gdy inna niż prompt ("" = brak)
  form_inline: boolean;              // instrukcja w linii nazwy punktu
  budget_phases: BudgetPhase[];      // tylko kind "budget"
}
export interface FormField { marker: string; label: string; sub: string[] }
export interface FormApplicantVariant { title: string; fields: FormField[] }
export interface FormStatementSet { title: string; intro: string; items: string[] }
export interface FormClauseBlock { text: string; kind: "p" | "heading" | "item"; marker: string; level: number }
export interface FormClause { title: string; new_page: boolean; blocks: FormClauseBlock[]; footnotes: string[] }
export interface CallForm {
  logos: string | null;              // zestaw logotypów wydruku (web/src/assets/<logos>/)
  annex_label: string; title: string; intro: string;
  budget_headers: Record<string, string[]>;   // 3 nagłówki kolumn per id sekcji "budget"
  applicant_variants: FormApplicantVariant[]; statement_sets: FormStatementSet[]; clauses: FormClause[];
}
export interface CallSource { title: string; url: string }
export interface CallSummary {
  id: string; title: string; short_pl: string; program: string; demo: boolean;
  opens_at: string; closes_at: string;   // RRRR-MM-DD
  state: CallState; is_open: boolean; max_amount: number;
}
export interface CallDetail extends CallSummary {
  based_on: CallSource[]; applicant_types: string[];
  sections: CallSection[]; statements: string[];
  form: CallForm | null;             // teksty wzoru formularza do wydruku 1:1
}

// wnioski grantowe (tabela applications; nazwy z prefiksem Grant — ApplicationStatus należy do M4)
export interface BudgetRow { action: string; when: string; cost: number; phase: BudgetPhase }   // action 1..300, when ..100, cost 0..10 000 000; phase domyślnie "prep"
export interface GrantApplicationCreate { call_id: string }
export interface GrantApplicationPatch { answers?: Record<string, string | null>; budget?: BudgetRow[] }
export interface GrantApplicationCheck { code: string; section_id: string | null; message_pl: string }
export interface GrantApplicationDetail {
  id: number; idea_id: number; call_id: string; call_title: string;
  answers: Record<string, string>; budget: BudgetRow[];
  total: number; max_amount: number; checks: GrantApplicationCheck[];
  created_at: string; updated_at: string;
}
export interface DraftRequest { section_id: string }
export interface DraftResponse { available: boolean; section_id: string; text: string; message_pl: string | null }
