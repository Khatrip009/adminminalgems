// src/api/sales/orders.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";
import { getAuthToken } from "@/utils/getAuthToken";   // ★ new
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
/* =========================================================
   TYPES
========================================================= */

export interface OrderOverview {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  items_count: number;
  placed_at: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  metadata?: any;
  [key: string]: any;
}

export interface DiamondSnapshot {
  id: string;
  product_id: string;
  diamond_type: string;
  shape: string;
  color: string | null;
  clarity: string | null;
  carat: number;
  pcs: number;
  rate: number;
  total_price: number;
  packet_no?: string | null;
  sort_order: number;
  metadata?: any;
}

export interface OrderItemSnapshot {
  id: string;
  product_id: string;
  sku: string | null;
  product_title: string;
  item_no: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  line_total: number;
  diamond_details: DiamondSnapshot[];
  metal_type: string | null;
  gold_carat: number | null;
  metal_rate: number | null;
  total_metal_price: number | null;
  total_weight: number | null;
  gold_weight: number | null;
  total_diamond_price: number | null;
  labour: number | null;
  profit_percent: number | null;
  profit_amount: number | null;
  primary_image_url: string | null;
  metadata: any;
}

export interface OrderDetail extends OrderOverview {
  shipments: any[];
  billing_address?: any;
  shipping_address?: any;
  notes?: string;
  internal_notes?: string;
}

export interface OrderDetailResponse {
  ok: boolean;
  order: OrderDetail;
  items: OrderItemSnapshot[];
}

export interface ListOrdersResponse {
  ok: boolean;
  orders: OrderOverview[];
  page: number;
  limit: number;
  total: number;
}

/* =========================================================
   TYPES – update this part only
========================================================= */
export interface CreateOrderItemPayload {
  product_id: string;
  quantity: number;

  // ----- Optional overrides for admin -----
  unit_price?: number;                  // override selling price per unit
  diamond_details?: DiamondSnapshot[];  // pass [] to hide diamonds
  metal_type?: string | null;
  gold_carat?: number | null;
  metal_rate?: number | null;
  total_metal_price?: number | null;
  total_weight?: number | null;
  gold_weight?: number | null;
  total_diamond_price?: number | null;
  labour?: number | null;               // set to 0 to hide labour line
  profit_percent?: number | null;       // set to 0 to hide profit line
  profit_amount?: number | null;
}



export interface CreateOrderPayload {
  user_id?: string | null;
  customer_id?: string | null;
  visitor_id?: string | null;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  currency?: string;
  items: CreateOrderItemPayload[];
  discount_total?: number;
  tax_total?: number;
  shipping_total?: number;
  billing_address?: any;
  shipping_address?: any;
  notes?: string;
  internal_notes?: string;
  metadata?: any;
}

/* =========================================================
   STATUS OPTIONS
========================================================= */

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partial",
] as const;

export const FULFILLMENT_STATUS_OPTIONS = [
  "unfulfilled",
  "partial",
  "fulfilled",
] as const;

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.sales}/orders`;

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      q.append(key, String(val));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* =========================================================
   API METHODS
========================================================= */

export async function listOrders(params?: {
  page?: number;
  limit?: number;
}): Promise<ListOrdersResponse> {
  return apiFetch<ListOrdersResponse>(
    `${BASE}${buildQuery({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    })}`
  );
}

export async function getMyOrders() {
  return apiFetch(`${BASE}/my`);
}

export async function getOrderById(id: string): Promise<OrderDetailResponse> {
  if (!id) throw new Error("order_id_required");
  return apiFetch<OrderDetailResponse>(`${BASE}/${encodeURIComponent(id)}`);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ ok: boolean; order: OrderDetail }> {
  return apiFetch(`${BASE}/admin`, {
    method: "POST",
    body: payload,
  });
}

export async function updateOrderStatus(
  id: string,
  payload: { status: string; payment_status?: string }
) {
  if (!id) throw new Error("order_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteOrder(id: string): Promise<{ ok: boolean; message: string }> {
  if (!id) throw new Error("order_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchCustomers(params?: any) {
  const res = await apiFetch<{ ok: boolean; customers: { id: string; full_name: string; email?: string }[] }>(
    `${API_ROUTES.masters}/customers${buildQuery({ limit: 200, ...params })}`
  );
  return res.customers || [];
}

/* =========================================================
   ORDER REGISTER PDF DOWNLOAD
========================================================= */
export async function downloadOrderRegisterPDF(token?: string) {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error("Not authenticated. Please log in again.");
  }

  // ★ Use absolute backend URL to bypass Vite dev server
  const res = await fetch(`${API_BASE_URL}/sales/orders/export/register`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to download order register");
  }

  const blob = await res.blob();
  if (blob.size === 0) throw new Error("Empty PDF received");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `order_register_${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function recordOrderPayment(
  orderId: string,
  payload: { amount: number; method?: string; transaction_id?: string; notes?: string }
) {
  return apiFetch(`${BASE}/${encodeURIComponent(orderId)}/payment`, {
    method: "POST",
    body: payload,
  });
}

// ★ Download a single order invoice PDF
// ★ Download a single order invoice PDF
export async function downloadOrderInvoicePDF(orderId: string, token?: string) {
  const authToken = token || getAuthToken();
  if (!authToken) throw new Error("Not authenticated. Please log in again.");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const res = await fetch(`${API_BASE_URL}/sales/orders/${encodeURIComponent(orderId)}/invoice-pdf`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to download invoice");
  }

  const blob = await res.blob();
  if (blob.size === 0) throw new Error("Empty invoice received");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice_${orderId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}