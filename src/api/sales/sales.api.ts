// src/api/sales/sales.api.ts

import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE
========================================================= */

const BASE = `${API_ROUTES.sales}/items`;

/* =========================================================
   HELPERS
========================================================= */

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, String(val));
    }
  });

  const s = q.toString();
  return s ? `?${s}` : "";
}

/* =========================================================
   TYPES (OPTIONAL BUT SAFE)
========================================================= */

export type SalesItemPayload = {
  number: string;
  item: string;

  diamond_pcs?: number;
  diamond_carat?: number;
  rate?: number;

  gold?: number;
  gold_price?: number;
  labour_charge?: number;

  diamond_packet_id?: string | null;
  diamond_packet?: string | null;

  craftsman_id?: string | null;
  craftman?: string | null;

  customer_id?: string | null;
  customer_name?: string | null;

  product_id?: string | null;
  product_image?: File | null;
};

export type SalesItemUpdatePayload = {
  number?: string;
  item?: string;
  diamond_pcs?: number;
  diamond_carat?: number;
  rate?: number;
  gold?: number;
  gold_price?: number;
  labour_charge?: number;
  selling_price?: number;
  product_id?: string | null;
  customer_id?: string | null;
  craftsman_id?: string | null;
  product_image?: File | null;
};

/* =========================================================
   CREATE SALES ITEM
========================================================= */

export const createSalesItem = (payload: SalesItemPayload | FormData) => {
  const isFormData = payload instanceof FormData;
  
  return apiFetch(BASE, {
    method: "POST",
    body: payload,
    headers: isFormData ? {} : undefined, // Let browser set Content-Type for FormData
  });
};

/* =========================================================
   LIST / SEARCH SALES ITEMS
========================================================= */

export const listSalesItems = (params?: {
  q?: string;
  customer_id?: string;
  diamond_packet_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  sort?: "number" | "created_at" | "selling_price";
  dir?: "ASC" | "DESC";
}) =>
  apiFetch(`${BASE}${buildQuery(params)}`);

/* =========================================================
   GET SINGLE SALES ITEM
========================================================= */

export const getSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`);
};

/* =========================================================
   UPDATE SALES ITEM
========================================================= */

export const updateSalesItem = (
  id: string,
  payload: SalesItemUpdatePayload | FormData
) => {
  if (!id) throw new Error("sales_item_id_required");
  
  const isFormData = payload instanceof FormData;

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
    headers: isFormData ? {} : undefined,
  });
};

/* =========================================================
   DELETE SALES ITEM
========================================================= */

export const deleteSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

/* =========================================================
   EXPORT CSV
========================================================= */

export const exportSalesItemsCSV = () =>
  apiFetch(`${BASE}/export/csv`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT PDF
========================================================= */

export const exportSalesItemsPDF = (params?: {
  from?: string;
  to?: string;
}) =>
  apiFetch(`${BASE}/export/pdf${buildQuery(params)}`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   IMPORT CSV
========================================================= */

export const importSalesItemsCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`${BASE}/import/csv`, {
    method: "POST",
    body: formData,
    headers: {
      // Let browser set boundary
    },
  });
};
