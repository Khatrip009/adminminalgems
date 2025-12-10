// src/api/leads.api.ts
import { apiFetch } from "../lib/apiClient";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | string;

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  product_interest?: string | null;
  message?: string | null;
  status: LeadStatus;
  source?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
}

export interface LeadListResponse {
  ok: boolean;
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadStats {
  today: number;
  yesterday: number;
  last_24h: number;
  this_week: number;
  total: number;
  delta: number;
}

export async function fetchLeads(params: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<LeadListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  const path = query ? `/leads?${query}` : "/leads";

  return apiFetch(path, {
    method: "GET",
  });
}

export async function fetchLead(
  id: string
): Promise<{ ok: boolean; lead: Lead }> {
  return apiFetch(`/leads/${id}`, {
    method: "GET",
  });
}

export async function updateLead(
  id: string,
  data: Partial<
    Pick<
      Lead,
      | "name"
      | "email"
      | "phone"
      | "company"
      | "country"
      | "product_interest"
      | "message"
      | "status"
      | "source"
    >
  >
): Promise<{ ok: boolean; lead: Lead }> {
  return apiFetch(`/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteLead(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  return apiFetch(`/leads/${id}`, {
    method: "DELETE",
  });
}

export async function createLead(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  product_interest?: string;
  message?: string;
  source?: string;
}): Promise<{ ok: boolean; lead: Lead }> {
  return apiFetch("/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchLeadNotes(
  leadId: string
): Promise<{ ok: boolean; notes: LeadNote[] }> {
  return apiFetch(`/leads/${leadId}/notes`, {
    method: "GET",
  });
}

export async function addLeadNote(
  leadId: string,
  note: string
): Promise<{ ok: boolean; note: LeadNote }> {
  return apiFetch(`/leads/${leadId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export async function fetchLeadStats(): Promise<{ ok: boolean; stats: LeadStats }> {
  return apiFetch("/leads-stats/stats", {
    method: "GET",
  });
}
