import type {
  AdminSolutionsQuery,
  ChallengeDetail,
  ChallengeSummary,
  ConsentMeta,
  CoverageRow,
  FeedbackCreate,
  GminaItem,
  Health,
  IndicatorDetail,
  IndicatorMeta,
  Inbox,
  InnovationTest,
  InnovationTestAccessLink,
  InnovationTestAccessStatus,
  InnovationTestApplication,
  InnovationTestApplicationCreate,
  InnovationTestApplicationPublic,
  InnovationTestCreate,
  InnovationTestFeedback,
  InnovationTestFeedbackCreate,
  InnovationTestReport,
  Page,
  Reply,
  ReplyCreate,
  ReportDetail,
  ReportListItem,
  ReportStatus,
  SimilarReport,
  SolutionAdminCreate,
  SolutionAdminDetail,
  SolutionAdminItem,
  SolutionCard,
  SolutionCreated,
  SolutionDetail,
  SolutionFacets,
  SolutionPatch,
  SolutionSubmit,
  SolutionUpsert,
  Stats,
  TaxonomyItem,
} from "./types";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const NETWORK_ERROR_MESSAGE = "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";

export function networkError(): ApiError {
  return new ApiError(0, "NETWORK", NETWORK_ERROR_MESSAGE);
}

function genericMessage(status: number): string {
  if (status === 404) return "Nie znaleziono tego, czego szukasz.";
  if (status >= 500) return "Serwer ma chwilowy problem. Spróbuj ponownie za chwilę.";
  return "Nie udało się wykonać tej operacji. Spróbuj ponownie.";
}

/** Zamienia odpowiedź nie-2xx na ApiError (czyta ErrorBody, gdy jest). */
export async function errorFromResponse(res: Response): Promise<ApiError> {
  try {
    const body: unknown = await res.json();
    const err = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    if (err && typeof err.code === "string") {
      const message = typeof err.message === "string" && err.message ? err.message : genericMessage(res.status);
      return new ApiError(res.status, err.code, message);
    }
  } catch {
    // brak JSON — komunikat ogólny niżej
  }
  return new ApiError(res.status, `HTTP_${res.status}`, genericMessage(res.status));
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(q?: Query): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value === null || value === undefined || value === "") continue;
    params.append(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Zwróć sparsowany JSON także przy tych statusach nie-2xx (np. 503 z /healthz). */
  acceptStatus?: number[];
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const init: RequestInit = { method, headers };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(path + buildQuery(opts.query), init);
  } catch {
    throw networkError();
  }

  if (!res.ok && !opts.acceptStatus?.includes(res.status)) {
    throw await errorFromResponse(res);
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, "BAD_RESPONSE", "Serwer zwrócił nieczytelną odpowiedź. Spróbuj ponownie.");
  }
}

export const api = {
  taxonomy: () => request<TaxonomyItem[]>("GET", "/api/taxonomy"),
  gminy: () => request<GminaItem[]>("GET", "/api/gminy"),
  // kind, knowledge_type, category, gmina, powiat, tag, has_video, evidence_min, q, status, sort, limit, offset
  solutions: (q?: Query) => request<Page<SolutionCard>>("GET", "/api/solutions", { query: q }),
  solution: (id: number) => request<SolutionDetail>("GET", `/api/solutions/${id}`),
  submitSolution: (body: SolutionSubmit) => request<SolutionCreated>("POST", "/api/solutions", { body }),
  patchSolution: (id: number, body: SolutionPatch) =>
    request<SolutionDetail>("PATCH", `/api/solutions/${id}`, { body }),

  adminSolutions: (q?: AdminSolutionsQuery) =>
    request<Page<SolutionAdminItem>>("GET", "/api/admin/solutions", { query: q as Query }),
  adminSolution: (id: number) => request<SolutionAdminDetail>("GET", `/api/admin/solutions/${id}`),
  createAdminSolution: (body: SolutionAdminCreate) =>
    request<SolutionAdminDetail>("POST", "/api/admin/solutions", { body }),
  updateAdminSolution: (id: number, body: SolutionUpsert) =>
    request<SolutionAdminDetail>("PUT", `/api/admin/solutions/${id}`, { body }),
  // matched, status, category, gmina, reporter_type, limit, offset
  reports: (q?: Query) => request<Page<ReportListItem>>("GET", "/api/reports", { query: q }),
  report: (id: number) => request<ReportDetail>("GET", `/api/reports/${id}`),
  similarReports: (id: number) => request<SimilarReport[]>("GET", `/api/reports/${id}/similar`),
  patchReport: (id: number, status: ReportStatus) =>
    request<ReportDetail>("PATCH", `/api/reports/${id}`, { body: { status } }),
  replies: (id: number) => request<Reply[]>("GET", `/api/reports/${id}/replies`),
  addReply: (id: number, body: ReplyCreate) => request<Reply>("POST", `/api/reports/${id}/replies`, { body }),
  inbox: () => request<Inbox>("GET", "/api/inbox"),
  // from, to (RRRR-MM-DD), category, gmina
  stats: (q?: Query) => request<Stats>("GET", "/api/stats", { query: q }),
  feedback: (body: FeedbackCreate) => request<void>("POST", "/api/feedback", { body }),
  health: () => request<Health>("GET", "/healthz", { acceptStatus: [503] }),

  // Moduł 2: Zasobnik wiedzy
  challenges: () => request<ChallengeSummary[]>("GET", "/api/challenges"),
  challenge: (code: string) => request<ChallengeDetail>("GET", `/api/challenges/${encodeURIComponent(code)}`),
  indicators: (q?: Query) => request<IndicatorMeta[]>("GET", "/api/indicators", { query: q }),
  indicator: (code: string) => request<IndicatorDetail>("GET", `/api/indicators/${encodeURIComponent(code)}`),
  // from, to (RRRR-MM-DD)
  coverage: (q?: Query) => request<CoverageRow[]>("GET", "/api/stats/coverage", { query: q }),
  // kind (domyślnie SOLUTION)
  solutionFacets: (q?: Query) => request<SolutionFacets>("GET", "/api/solutions/facets", { query: q }),

  innovationTests: (q?: Query) =>
    request<Page<InnovationTest>>("GET", "/api/innovation-tests", { query: q }),
  innovationTest: (id: number, q?: Query) =>
    request<InnovationTest>("GET", `/api/innovation-tests/${id}`, { query: q }),
  createInnovationTest: (body: InnovationTestCreate) =>
    request<InnovationTest>("POST", "/api/innovation-tests", { body }),
  closeInnovationTest: (id: number) =>
    request<InnovationTest>("POST", `/api/innovation-tests/${id}/close`),
  applyInnovationTest: (id: number, body: InnovationTestApplicationCreate) =>
    request<InnovationTestApplicationPublic>("POST", `/api/innovation-tests/${id}/applications`, {
      body,
    }),
  innovationTestApplications: (id: number, q?: Query) =>
    request<Page<InnovationTestApplication>>("GET", `/api/innovation-tests/${id}/applications`, {
      query: q,
    }),
  acceptInnovationApplication: (testId: number, applicationId: number) =>
    request<InnovationTestAccessLink>(
      "POST",
      `/api/innovation-tests/${testId}/applications/${applicationId}/accept`,
    ),
  rejectInnovationApplication: (testId: number, applicationId: number, reason: string) =>
    request<InnovationTestApplication>(
      "POST",
      `/api/innovation-tests/${testId}/applications/${applicationId}/reject`,
      { body: { reason } },
    ),
  cancelInnovationApplication: (
    testId: number,
    applicationId: number,
    reason: string,
    byTester = false,
  ) =>
    request<InnovationTestApplication>(
      "POST",
      `/api/innovation-tests/${testId}/applications/${applicationId}/cancel`,
      { body: { reason }, query: { by_tester: byTester } },
    ),
  innovationTestAccess: (token: string) =>
    request<InnovationTestAccessStatus>("GET", `/api/innovation-tests/access/${token}`),
  submitInnovationFeedback: (token: string, body: InnovationTestFeedbackCreate) =>
    request<InnovationTestFeedback>("POST", `/api/innovation-tests/access/${token}`, { body }),
  innovationTestReport: (id: number) =>
    request<InnovationTestReport>("GET", `/api/innovation-tests/${id}/report`),
  regenerateInnovationTestReport: (id: number) =>
    request<InnovationTestReport>("POST", `/api/innovation-tests/${id}/report/regenerate`),
  moderateInnovationFeedback: (testId: number, feedbackId: number, visible: boolean) =>
    request<InnovationTestFeedback>(
      "POST",
      `/api/innovation-tests/${testId}/feedback/${feedbackId}/moderate`,
      { body: { comment_visible_to_author: visible } },
    ),
  innovationConsent: () => request<ConsentMeta>("GET", "/api/innovation-tests/meta/consent"),
};
