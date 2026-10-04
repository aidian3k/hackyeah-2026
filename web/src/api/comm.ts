// Moduł 5 — Platforma komunikacji: typy 1:1 z `api/comm/schemas.py` i klient HTTP.
// Osobny plik, żeby nie zmieniać `types.ts` i `client.ts` (współdzielonych z innymi modułami).
import { request, type Query } from "./client";
import type { Page, ReporterType, SolutionCard } from "./types";

export type ThreadKind = "QUESTION" | "MENTORING" | "PARTNERSHIP";
export type ThreadStatus = "AI_PENDING" | "WAITING_STAFF" | "WAITING_USER" | "CLOSED";
export type MessageRole = "USER" | "STAFF" | "MENTOR" | "ASSISTANT" | "SYSTEM";
export type OrgSector = "NGO" | "JST" | "PUBLIC" | "BUSINESS" | "SCIENCE" | "RESIDENTS";
export type Intent = "OFFER" | "SEEK";
export type OfferStatus = "PUBLISHED" | "CLOSED";

export interface ThreadCreate {
  kind: ThreadKind;
  body: string;
  subject?: string | null;
  category?: string | null;
  reporter_type?: ReporterType;
  author_label?: string | null;
  session_id?: string | null;
  partnership_id?: number | null;
}

export interface MessageCreate {
  role: "USER" | "STAFF" | "MENTOR";
  body: string;
  author_label?: string | null;
  mentor_id?: number | null;
}

export interface ThreadPatch {
  status?: "WAITING_STAFF" | "CLOSED";
  /** `null` usuwa przydział eksperta. */
  assigned_mentor_id?: number | null;
}

export interface MentorRef {
  id: number;
  display_name: string;
}

export interface Mentor extends MentorRef {
  organization: string | null;
  expertise: string;
  categories: string[];
}

export interface ThreadMessage {
  id: number;
  role: MessageRole;
  author_label: string | null;
  mentor: MentorRef | null;
  body: string;
  /** Tylko odpowiedź asystenta; `[n]` w treści = pozycja n na tej liście. */
  cards: SolutionCard[];
  created_at: string;
}

export interface ThreadListItem {
  id: number;
  kind: ThreadKind;
  status: ThreadStatus;
  subject: string;
  category: string | null;
  category_label_pl: string | null;
  reporter_type: ReporterType;
  author_label: string | null;
  partnership_id: number | null;
  assigned_mentor: MentorRef | null;
  last_message_role: MessageRole | null;
  last_message_at: string;
  has_reply: boolean;
  created_at: string;
}

export interface ThreadDetail extends ThreadListItem {
  messages: ThreadMessage[];
}

export interface PartnershipCreate {
  intent: Intent;
  organization: string;
  sector: OrgSector;
  title: string;
  description: string;
  category?: string | null;
  session_id?: string | null;
}

export interface PartnershipOffer {
  id: number;
  intent: Intent;
  organization: string;
  sector: OrgSector;
  title: string;
  description: string;
  category: string | null;
  category_label_pl: string | null;
  status: OfferStatus;
  created_at: string;
}

export const commApi = {
  createThread: (body: ThreadCreate) => request<ThreadDetail>("POST", "/api/threads", { body }),
  // status, kind, mentor_id, ids (CSV), limit, offset
  listThreads: (q?: Query) => request<Page<ThreadListItem>>("GET", "/api/threads", { query: q }),
  getThread: (id: number) => request<ThreadDetail>("GET", `/api/threads/${id}`),
  addMessage: (id: number, body: MessageCreate) =>
    request<ThreadMessage>("POST", `/api/threads/${id}/messages`, { body }),
  patchThread: (id: number, body: ThreadPatch) =>
    request<ThreadDetail>("PATCH", `/api/threads/${id}`, { body }),
  markRead: (id: number) => request<void>("POST", `/api/threads/${id}/read`),
  mentors: (category?: string | null) => request<Mentor[]>("GET", "/api/mentors", { query: { category } }),
  // intent, sector, category, status, limit, offset
  listOffers: (q?: Query) => request<Page<PartnershipOffer>>("GET", "/api/partnerships", { query: q }),
  createOffer: (body: PartnershipCreate) =>
    request<PartnershipOffer>("POST", "/api/partnerships", { body }),
  getOffer: (id: number) => request<PartnershipOffer>("GET", `/api/partnerships/${id}`),
  patchOffer: (id: number, status: OfferStatus) =>
    request<PartnershipOffer>("PATCH", `/api/partnerships/${id}`, { body: { status } }),
  offerMatches: (id: number) => request<PartnershipOffer[]>("GET", `/api/partnerships/${id}/matches`),
};
