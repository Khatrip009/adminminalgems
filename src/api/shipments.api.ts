// src/shipments.api.ts
import { apiFetch } from "../lib/apiClient";

export type ShipmentStatus = "pending" | "shipped" | "delivered" | "cancelled";

export interface Shipment {
  id: string;
  order_id: string;
  shipping_method_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ListShipmentsResponse {
  ok: boolean;
  shipments: Shipment[];
}

export interface CreateShipmentInput {
  order_id: string;
  shipping_method_id?: string | null;
  tracking_number?: string;
  carrier?: string;
  status?: ShipmentStatus;
}

export interface UpdateShipmentInput {
  shipping_method_id?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  status?: ShipmentStatus;
}

export async function listShipments(orderId: string): Promise<ListShipmentsResponse> {
  return apiFetch(`/shipments?order_id=${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

export async function createShipment(
  payload: CreateShipmentInput
): Promise<{ ok: boolean; shipment: Shipment }> {
  return apiFetch("/shipments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateShipment(
  id: string,
  payload: UpdateShipmentInput
): Promise<{ ok: boolean; shipment: Shipment }> {
  return apiFetch(`/shipments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteShipment(
  id: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/shipments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const SHIPMENT_STATUS_OPTIONS: ShipmentStatus[] = [
  "pending",
  "shipped",
  "delivered",
  "cancelled",
];



export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  base_rate: number;
  rate_config?: any | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  name: string;
  type: "flat" | "weight" | "order_value";
  amount: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  active: boolean;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ===========================
   SHIPPING METHODS
   =========================== */

export async function listShippingMethods(params?: {
  page?: number;
  limit?: number;
  q?: string;
  only_active?: boolean;
}): Promise<{ methods: ShippingMethod[]; total: number; page: number; limit: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.q) searchParams.set("q", params.q);
  if (params?.only_active) searchParams.set("only_active", "true");

  const query = searchParams.toString();
  const url = `/shipping-methods${query ? `?${query}` : ""}`;

  const res = await apiFetch(url, { method: "GET" });
  return {
    methods: res.methods || [],
    total: res.total || 0,
    page: res.page || params?.page || 1,
    limit: res.limit || params?.limit || 20,
  };
}

export async function createShippingMethod(payload: {
  code: string;
  name: string;
  description?: string | null;
  base_rate: number;
  is_active?: boolean;
  rate_config?: any | null;
}): Promise<{ method: ShippingMethod }> {
  const res = await apiFetch("/shipping-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function updateShippingMethod(
  id: string,
  payload: Partial<{
    code: string;
    name: string;
    description?: string | null;
    base_rate: number;
    is_active: boolean;
    rate_config?: any | null;
  }>
): Promise<{ method: ShippingMethod }> {
  const res = await apiFetch(`/shipping-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function deleteShippingMethod(id: string): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/shipping-methods/${id}`, {
    method: "DELETE",
  });
  return res;
}

/* ===========================
   SHIPPING RULES
   =========================== */

export async function listShippingRules(): Promise<{ rules: ShippingRule[] }> {
  const res = await apiFetch("/shipping-rules", {
    method: "GET",
  });
  return { rules: res.rules || [] };
}

export async function createShippingRule(payload: {
  name: string;
  type: "flat" | "weight" | "order_value";
  amount: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  active?: boolean;
}): Promise<{ rule: ShippingRule }> {
  const res = await apiFetch("/shipping-rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function updateShippingRule(
  id: string,
  payload: Partial<{
    name: string;
    type: "flat" | "weight" | "order_value";
    amount: number;
    min_order_value?: number | null;
    max_order_value?: number | null;
    min_weight?: number | null;
    max_weight?: number | null;
    active?: boolean;
  }>
): Promise<{ rule: ShippingRule }> {
  const res = await apiFetch(`/shipping-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function deleteShippingRule(id: string): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/shipping-rules/${id}`, {
    method: "DELETE",
  });
  return res;
}
