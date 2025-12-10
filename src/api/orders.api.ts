// src/orders.api.ts

import { apiFetch } from "../lib/apiClient";

/**
 * Basic overview row – usually coming from public.order_overview
 * (we keep it slightly flexible with [key: string]: any)
 */
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

/**
 * Full order record (from public.orders)
 */
export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_id: string | null;
  visitor_id: string | null;

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

  billing_address: any | null;
  shipping_address: any | null;

  notes: string | null;
  internal_notes: string | null;

  placed_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;

  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Order line item (from public.order_items + joined product fields)
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  sku: string | null;
  product_title: string | null;

  quantity: number;
  unit_price: number;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  line_total: number;

  // from JOIN public.products
  title?: string | null;
  slug?: string | null;

  metadata: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Admin: list orders response
 */
export interface ListOrdersResponse {
  ok: boolean;
  orders: OrderOverview[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Customer: my orders response
 */
export interface MyOrdersResponse {
  ok: boolean;
  orders: OrderOverview[];
}

/**
 * Single order response
 */
export interface GetOrderResponse {
  ok: boolean;
  order: Order;
  items: OrderItem[];
}

/**
 * PATCH /orders/:id/status body
 */
export interface UpdateOrderStatusPayload {
  status: string;
  payment_status?: string;
}

/**
 * PATCH /orders/:id/status response
 */
export interface UpdateOrderStatusResponse {
  ok: boolean;
  order: Order;
}

/**
 * Optional: shared status lists for dropdowns in the UI
 * (DB is free-text, but these are the "canonical" values we’ll use in admin)
 */
export const ORDER_STATUS_OPTIONS: string[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export const PAYMENT_STATUS_OPTIONS: string[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partial",
];

export const FULFILLMENT_STATUS_OPTIONS: string[] = [
  "unfulfilled",
  "partial",
  "fulfilled",
];

/**
 * Admin: list all orders (paginated)
 * GET /orders?page=&limit=
 */
export async function listOrders(params?: {
  page?: number;
  limit?: number;
}): Promise<ListOrdersResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  }).toString();

  const res = await apiFetch<ListOrdersResponse>(`/orders?${query}`);

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  // 🔴 IMPORTANT: normalize each order row
  const normalizedOrders: OrderOverview[] = (res.orders || []).map(
    (o: any) => {
      // Try different possible keys that backend might be using
      const id =
        o.id || o.order_id || o.orderId || o.orderID || null;

      return {
        // Keep everything else from backend
        ...o,

        // Force a proper id for frontend usage (Settlements, Orders list, etc.)
        id,

        // Ensure numbers are numbers (not strings)
        subtotal: Number(o.subtotal ?? 0),
        discount_total: Number(o.discount_total ?? 0),
        tax_total: Number(o.tax_total ?? 0),
        shipping_total: Number(o.shipping_total ?? 0),
        grand_total: Number(o.grand_total ?? 0),
        items_count: Number(o.items_count ?? 0),

        // Default currency to INR if missing
        currency: o.currency || "INR",
      };
    }
  );

  return {
    ...res,
    orders: normalizedOrders,
  };
}


/**
 * Customer: get my own orders
 * GET /orders/my
 */
export async function getMyOrders(): Promise<MyOrdersResponse> {
  const res = await apiFetch<MyOrdersResponse>("/orders/my");
  if (!res.ok) {
    throw new Error("Failed to fetch my orders");
  }
  return res;
}

/**
 * Get one order + items
 * GET /orders/:id
 */
export async function getOrderById(id: string): Promise<GetOrderResponse> {
  const res = await apiFetch<GetOrderResponse>(`/orders/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch order");
  }
  return res;
}

/**
 * Admin: update order + (optionally) payment status
 * PATCH /orders/:id/status
 */
export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload
): Promise<UpdateOrderStatusResponse> {
  const res = await apiFetch<UpdateOrderStatusResponse>(
    `/orders/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update order status");
  }

  return res;
}
