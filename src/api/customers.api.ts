// src/api/customers.api.ts
import { apiFetch } from "../lib/apiClient";

export interface Customer {
  id: string;
  user_id?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  metadata?: any;
  created_at?: string | null;
  phone_verified?: boolean;
  notes?: string | null;
  tags?: string[] | null;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label?: string | null;
  full_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  is_default_billing: boolean;
  is_default_shipping: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  id: string;
  product_id: string;
  title?: string;
  slug?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  line_total: number;
}

export interface CustomerOrder {
  id: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  items_count: number;
  placed_at: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;

  // include shipments inside each order (Option B)
  shipments?: Array<{
    id: string;
    shipping_method_id: string | null;
    tracking_number: string | null;
    carrier: string | null;
    status: string;
    shipped_at: string | null;
    delivered_at: string | null;
  }>;

  items: CustomerOrderItem[];
}

export interface CustomerFullResponse {
  ok: boolean;
  customer: Customer;
  addresses: CustomerAddress[];

  current_order: CustomerOrder | null;

  orders: CustomerOrder[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/* -------------------------------------------------------
   LIST CUSTOMERS
------------------------------------------------------- */
export async function listCustomers(params: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<{ ok: boolean; customers: Customer[]; total: number; page: number; limit: number }> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);

  const qStr = search.toString();
  const url = qStr ? `/customers?${qStr}` : `/customers`;

  return apiFetch(url, { method: "GET" });
}

/* -------------------------------------------------------
   GET FULL CUSTOMER DETAIL
------------------------------------------------------- */
export async function getCustomerFull(
  id: string,
  page = 1
): Promise<CustomerFullResponse> {
  const url = `/customers/${id}/full?page=${page}`;
  return apiFetch(url, { method: "GET" });
}

/* -------------------------------------------------------
   GET CUSTOMER BASIC (used by old UI)
------------------------------------------------------- */
export async function getCustomer(id: string): Promise<{
  ok: boolean;
  customer: Customer;
  addresses: CustomerAddress[];
}> {
  return apiFetch(`/customers/${id}`, { method: "GET" });
}

/* -------------------------------------------------------
   UPDATE CUSTOMER
------------------------------------------------------- */
export async function updateCustomer(
  id: string,
  payload: Partial<Customer>
): Promise<{ ok: boolean; customer: Customer }> {
  return apiFetch(`/customers/${id}`, {
    method: "PUT",
    body: payload,
  });
}

/* -------------------------------------------------------
   ADDRESSES – CRUD
------------------------------------------------------- */

// List all addresses for admin
export async function listCustomerAddresses(
  customerId: string
): Promise<{ ok: boolean; addresses: CustomerAddress[] }> {
  return apiFetch(`/customers/${customerId}`, {
    method: "GET",
  });
}

// Update address (Admin)
export async function updateCustomerAddress(
  addressId: string,
  payload: Partial<CustomerAddress>
): Promise<{ ok: boolean; address: CustomerAddress }> {
  return apiFetch(`/customer/addresses/${addressId}`, {
    method: "PUT",
    body: payload,
  });
}

// Delete address
export async function deleteCustomerAddress(
  addressId: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/customer/addresses/${addressId}`, {
    method: "DELETE",
  });
}

// Mark as default shipping
export async function setDefaultShipping(addressId: string) {
  return apiFetch(`/customer/addresses/${addressId}/default-shipping`, {
    method: "POST",
  });
}

// Mark as default billing
export async function setDefaultBilling(addressId: string) {
  return apiFetch(`/customer/addresses/${addressId}/default-billing`, {
    method: "POST",
  });
}
