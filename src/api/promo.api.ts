// src/promo.api.ts

import { apiFetch } from "../lib/apiClient";

export type PromoType = "fixed" | "percent" | "free_shipping";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  type: PromoType;
  value: number;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: string | null;
  valid_to: string | null;
  min_order_value: number | null;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ListPromoCodesResponse {
  ok: boolean;
  promos: PromoCode[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplyPromoResponse {
  ok: boolean;
  promo: PromoCode;
  discount: number;
  type: PromoType;
}

export interface PromoCodeInput {
  code: string;
  description?: string | null;
  type: PromoType;
  value: number;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  min_order_value?: number | null;
  is_active?: boolean;
  metadata?: any;
}

export interface UpdatePromoCodeInput
  extends Partial<Omit<PromoCodeInput, "code">> {
  code?: string;
}

// ---------- PUBLIC: APPLY PROMO CODE ----------
export async function applyPromoCode(input: {
  promo_code: string;
  subtotal: number;
}): Promise<ApplyPromoResponse> {
  return apiFetch("/promo/apply", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- ADMIN: LIST CODES ----------
export async function listPromoCodes(params?: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<ListPromoCodesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);

  const qs = query.toString();
  const url = qs ? `/promo/codes?${qs}` : "/promo/codes";

  return apiFetch(url);
}

// ---------- ADMIN: GET SINGLE ----------
export async function getPromoCode(id: string): Promise<{
  ok: boolean;
  promo: PromoCode;
}> {
  return apiFetch(`/promo/codes/${encodeURIComponent(id)}`);
}

// ---------- ADMIN: CREATE ----------
export async function createPromoCode(
  data: PromoCodeInput
): Promise<{ ok: boolean; promo: PromoCode }> {
  return apiFetch("/promo/codes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------- ADMIN: UPDATE ----------
export async function updatePromoCode(
  id: string,
  data: UpdatePromoCodeInput
): Promise<{ ok: boolean; promo: PromoCode }> {
  return apiFetch(`/promo/codes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------- ADMIN: TOGGLE ACTIVE ----------
export async function togglePromoCode(
  id: string,
  is_active?: boolean
): Promise<{ ok: boolean; promo: PromoCode }> {
  return apiFetch(`/promo/codes/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
    body: JSON.stringify(
      typeof is_active === "boolean" ? { is_active } : {}
    ),
  });
}
