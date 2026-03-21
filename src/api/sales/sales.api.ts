// src/api/sales/sales.api.ts
// PRODUCTION-GRADE SALES API
// Supports CRUD, Profit %, CSV Import, CSV/Excel Export,
// Register PDF & Invoice PDF, Grouping, and Selected Exports

import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE
========================================================= */

const BASE = `${API_ROUTES.sales}/items`;

/* =========================================================
   QUERY BUILDER
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
   TYPES
========================================================= */

export interface DiamondInput {
  pcs: number;
  carat: number;
  rate: number;
  type?: string;
  packet_no?: string | null;
}

export interface SalesItemPayload {
  number: string;
  item: string;
  diamonds?: DiamondInput[];
  gold?: number;
  gold_carat?: number;           // Added for gold karat
  gold_rate?: number;            // Added for gold rate
  gold_price?: number;
  labour_charge?: number;
  profit_percent?: number;
  product_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  craftsman_id?: string | null;
  craftman?: string | null;
  product_image?: File | null;
}

export interface SalesItemUpdatePayload
  extends Partial<SalesItemPayload> {}

export interface GroupedSalesResult {
  results: Array<{
    customer_id?: string;
    customer_name: string;
    total_orders: number;
    total_sales: number;
  }>;
}

export interface GroupedCraftsmanResult {
  results: Array<{
    craftsman_id?: string;
    craftsman_name: string;
    total_orders: number;
    total_labour: number;
    total_sales: number;
  }>;
}

/* =========================================================
   CREATE
========================================================= */

export const createSalesItem = (
  payload: SalesItemPayload | FormData
) => {
  const isFormData = payload instanceof FormData;

  return apiFetch(BASE, {
    method: "POST",
    body: payload,
    headers: isFormData ? {} : undefined,
  });
};

/* =========================================================
   LIST / SEARCH / FILTER / SORT / PAGINATION
========================================================= */

export const listSalesItems = (params?: {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;          // Date filter start
  to?: string;            // Date filter end
  customer_id?: string;
  craftsman_id?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
}) =>
  apiFetch(`${BASE}${buildQuery(params)}`);

/* =========================================================
   GET BY ID
========================================================= */

export const getSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`);
};

/* =========================================================
   UPDATE
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
   DELETE
========================================================= */

export const deleteSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

/* =========================================================
   GROUPING APIS
========================================================= */

export const groupSalesByCustomer = () =>
  apiFetch(`${BASE}/group/customer`);

export const groupSalesByCraftsman = () =>
  apiFetch(`${BASE}/group/craftsman`);

/* =========================================================
   EXPORT SELECTED ROWS
========================================================= */

export const exportSelectedSalesExcel = (ids: string[]) => {
  if (!ids || !ids.length) throw new Error("ids_required");

  return apiFetch(`${BASE}/export/excel-selected`, {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: {
      "Content-Type": "application/json",
    },
    responseType: "blob",
  });
};

export const exportSelectedSalesPDF = (ids: string[]) => {
  if (!ids || !ids.length) throw new Error("ids_required");

  return apiFetch(`${BASE}/export/pdf-selected`, {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: {
      "Content-Type": "application/json",
    },
    responseType: "blob",
  });
};

/* =========================================================
   EXPORT – CSV (ALL)
========================================================= */

export const exportSalesItemsCSV = () =>
  apiFetch(`${BASE}/export/csv`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – EXCEL (ALL)
========================================================= */

export const exportSalesItemsExcel = () =>
  apiFetch(`${BASE}/export/excel`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – REGISTER PDF (A3 LEDGER STYLE WITH PAGE SUBTOTAL)
========================================================= */

export const exportSalesRegisterPDF = () =>
  apiFetch(`${BASE}/export/register-pdf`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – INVOICE PDF (PROFESSIONAL JEWELLERY INVOICE)
========================================================= */

export const exportSalesInvoicePDF = (saleId: string) => {
  if (!saleId) throw new Error("sales_item_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(saleId)}/export/invoice-pdf`,
    {
      method: "GET",
      responseType: "blob",
    }
  );
};

/* =========================================================
   IMPORT – CSV
========================================================= */

export const importSalesItemsCSV = (file: File) => {
  if (!file) throw new Error("csv_file_required");

  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`${BASE}/import/csv`, {
    method: "POST",
    body: formData,
    headers: {}, // browser sets multipart boundary
  });
};