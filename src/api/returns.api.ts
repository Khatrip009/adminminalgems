// src/api/returns.api.ts
import { apiFetch } from "../lib/apiClient";

/* ------------------ TYPES ------------------ */

export interface ReturnRow {
  id: string;
  order_id: string;
  order_number?: string;

  type: string;
  reason_code: string;
  reason_notes: string | null;

  status: string;
  preferred_resolution: string | null;

  refund_amount: number | null;
  currency: string;

  photos: string[] | null;

  created_at: string;
  updated_at: string;
}

export interface ReturnEvent {
  id: number;
  event_type: string;
  notes: string | null;
  created_at: string;
}

export interface ReturnDetailResponse {
  ok: boolean;
  return: ReturnRow;
  events: ReturnEvent[];
}

export interface ListReturnsResponse {
  ok: boolean;
  returns: ReturnRow[];
}

/* ------------------ ADMIN FUNCTIONS ------------------ */

export async function listReturns(): Promise<ListReturnsResponse> {
  return apiFetch<ListReturnsResponse>("/returns");
}

export async function getReturnById(id: string): Promise<ReturnDetailResponse> {
  return apiFetch<ReturnDetailResponse>(`/returns/${id}`);
}

export async function updateReturnStatus(
  id: string,
  payload: { status: string; notes?: string }
): Promise<ReturnDetailResponse> {
  return apiFetch<ReturnDetailResponse>(`/returns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* ------------------ CUSTOMER FUNCTIONS ------------------ */

export interface CreateReturnInput {
  order_id: string;
  order_item_id?: string;
  type: string;
  reason_code: string;
  reason_notes?: string;
  preferred_resolution?: string;
  refund_amount?: number;
  photos?: string[];
}

export interface CreateReturnResponse {
  ok: boolean;
  return_id: string;
}

export async function createReturnRequest(payload: CreateReturnInput) {
  return apiFetch<CreateReturnResponse>("/account/returns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ------------------ REPLACEMENT SHIPMENT ------------------ */

export async function createReplacementShipment(return_id: string) {
  return apiFetch(`/returns/${return_id}/create-replacement`, {
    method: "POST",
  });
}
