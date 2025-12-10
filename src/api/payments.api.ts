// src/api/payments.api.ts

import { apiFetch } from "../lib/apiClient";

/* =============================================================================
 * TYPES
 * =============================================================================
 */

/** Payment row from public.order_payments (+ optional joins) */
export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string | null;

  amount: number;
  currency: string;
  status: string;

  paid_at: string | null;
  metadata: any;
  raw_response: any;

  created_at: string;

  // Joined
  order_number?: string;

  // Optional invoice-join fields (if backend ever extends list)
  invoice_number?: string | null;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  shipping_total?: number;
  grand_total?: number;
  invoice_date?: string | null;
}

/** GET /payments response */
export interface ListPaymentsResponse {
  ok: boolean;
  payments: Payment[];

  // Backend currently does not send these; keep optional
  page?: number;
  limit?: number;
  total?: number;
}

/** GET /payments/:id response */
export interface GetPaymentResponse {
  ok: boolean;
  payment: Payment;
}

/** Payment gateway logs (webhook logs) */
export interface PaymentLog {
  id: string;                 // uuid in DB
  payment_id: string;
  event_type: string | null;
  status: string | null;
  payload: any;               // from payment_gateway_logs.payload
  created_at: string;
}

/** GET /payments/:id/logs response */
export interface PaymentLogResponse {
  ok: boolean;
  logs: PaymentLog[];
}

/* :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   REFUNDS
   :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: */

export interface Refund {
  id: string;
  order_payment_id: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;

  created_at: string;
  processed_at: string | null;

  metadata: any;
  raw_response: any;

  // joined
  order_id?: string;
  order_number?: string;
}

/** GET /payments/refunds/list/all */
export interface ListRefundsResponse {
  ok: boolean;
  refunds: Refund[];
}

/** Payload when creating a refund for a payment */
export interface CreateRefundInput {
  amount: number;
  reason?: string | null;
}

/** POST /payments/:paymentId/refund response */
export interface CreateRefundResponse {
  ok: boolean;
  refund: Refund;
}

/* :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   INVOICES
   :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: */

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;

  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_total: number;
  grand_total: number;

  currency: string;
  status: string;

  issued_at: string | null;
  paid_at: string | null;

  metadata: any;
  created_at: string;

  order_number?: string;

  // Optional: backend joins from orders (if you ever want to use them)
  order_billing_address?: any;
  order_shipping_address?: any;
  order_currency?: string;
}

export interface ListInvoicesResponse {
  ok: boolean;
  invoices: Invoice[];
}

export interface GetInvoiceResponse {
  ok: boolean;
  invoice: Invoice;
}

/* :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   SETTLEMENTS
   :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: */

/**
 * Shape based on:
 *  SELECT
 *    s.id,
 *    s.provider,
 *    s.settlement_date,
 *    s.amount,
 *    s.transaction_ids,
 *    s.raw_file,
 *    s.created_at
 *  FROM public.payment_settlements s ...
 */
export interface Settlement {
  id: string;
  provider: string | null;
  settlement_date: string | null;
  amount: number;

  transaction_ids?: string[] | null;
  raw_file?: any;
  created_at: string;
}

export interface ListSettlementsResponse {
  ok: boolean;
  settlements: Settlement[];
}

/* =============================================================================
 * API METHODS
 * =============================================================================
 */

/**
 * List payments (admin)
 * GET /payments?page=1&limit=20
 */
export async function listPayments(params?: {
  page?: number;
  limit?: number;
}): Promise<ListPaymentsResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  }).toString();

  return apiFetch<ListPaymentsResponse>(`/payments?${query}`);
}

/**
 * Get single payment
 * GET /payments/:id
 */
export async function getPaymentById(id: string): Promise<GetPaymentResponse> {
  return apiFetch<GetPaymentResponse>(`/payments/${id}`);
}

/**
 * Get payment logs (webhook events)
 * GET /payments/:id/logs
 */
export async function getPaymentLogs(
  id: string
): Promise<PaymentLogResponse> {
  return apiFetch<PaymentLogResponse>(`/payments/${id}/logs`);
}

/**
 * List all refunds
 * GET /payments/refunds/list/all
 */
export async function listRefunds(): Promise<ListRefundsResponse> {
  return apiFetch<ListRefundsResponse>(`/payments/refunds/list/all`);
}

/**
 * Create a refund for a given payment
 * POST /payments/:paymentId/refund
 *
 * NOTE: backend route is /:id/refund (singular).
 */
export async function createRefund(
  paymentId: string,
  payload: CreateRefundInput
): Promise<CreateRefundResponse> {
  return apiFetch<CreateRefundResponse>(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * List all invoices
 * GET /payments/invoices/all
 */
export async function listInvoices(): Promise<ListInvoicesResponse> {
  return apiFetch<ListInvoicesResponse>(`/payments/invoices/all`);
}

/**
 * Get a single invoice
 * GET /payments/invoice/:id
 */
export async function getInvoiceById(
  id: string
): Promise<GetInvoiceResponse> {
  return apiFetch<GetInvoiceResponse>(`/payments/invoice/${id}`);
}

/**
 * List settlements
 * GET /payments/settlements/all
 */
export async function listSettlements(): Promise<ListSettlementsResponse> {
  return apiFetch<ListSettlementsResponse>(`/payments/settlements/all`);
}

/**
 * Get invoices belonging to the payment's order
 * GET /payments/:paymentId/invoices
 */
export async function getInvoicesByPaymentId(
  paymentId: string
): Promise<ListInvoicesResponse> {
  return apiFetch<ListInvoicesResponse>(
    `/payments/${encodeURIComponent(paymentId)}/invoices`
  );
}

// Optional alias for older UI code
export const getInvoicesByOrder = getInvoicesByPaymentId;

/**
 * Get refunds for a specific payment
 * GET /payments/:paymentId/refunds
 */
export async function getRefundsByPayment(
  paymentId: string
): Promise<ListRefundsResponse> {
  return apiFetch<ListRefundsResponse>(
    `/payments/${encodeURIComponent(paymentId)}/refunds`
  );
}

/**
 * Convenience helper – same as listInvoices
 */
export async function getAllInvoices(): Promise<ListInvoicesResponse> {
  return apiFetch<ListInvoicesResponse>("/payments/invoices/all");
}
