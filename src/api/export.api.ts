// src/api/export.api.ts
// Handles all admin export endpoints: CSV, PDF, Labels, ZIP

import { apiFetchRaw } from "../lib/apiClient";

/* ------------ INTERNAL BLOB HELPER ---------------- */
async function downloadAsBlob(
  url: string
): Promise<{ blob: Blob; filename: string }> {
  const res = await apiFetchRaw(url);

  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  let filename = "download";

  const match = disposition.match(/filename="(.+?)"/);
  if (match) filename = match[1];

  const blob = await res.blob();
  return { blob, filename };
}

/** Utility: force browser download */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------
   ORDERS EXPORTS  (paths are RELATIVE to API_BASE_URL)
   Backend mounts: app.use("/api/orders", orderRoutes)
   So we call: /orders/...
------------------------------------------------------- */

/** Orders CSV */
export async function exportOrdersCSV() {
  const { blob, filename } = await downloadAsBlob("/orders/export/csv");
  triggerBrowserDownload(blob, filename);
}

/** Orders PDF Summary */
export async function exportOrdersPDF() {
  const { blob, filename } = await downloadAsBlob("/orders/export/pdf");
  triggerBrowserDownload(blob, filename);
}

/** ZIP Export (CSV bundle, future: invoices, labels) */
export async function exportOrdersZIP() {
  const { blob, filename } = await downloadAsBlob("/orders/export/bulk-zip");
  triggerBrowserDownload(blob, filename || "orders_bundle.zip");
}

/** Shipping Labels PDF */
export async function exportShippingLabelsPDF() {
  const { blob, filename } = await downloadAsBlob(
    "/orders/export/shipping-labels"
  );
  triggerBrowserDownload(blob, filename);
}

/* ------------------------------------------------------
   LEADS EXPORTS (optional, once backend is added)
------------------------------------------------------- */

export async function exportLeadsCSV() {
  const { blob, filename } = await downloadAsBlob("/leads/export/csv");
  triggerBrowserDownload(blob, filename);
}

export async function exportLeadsPDF() {
  const { blob, filename } = await downloadAsBlob("/leads/export/pdf");
  triggerBrowserDownload(blob, filename);
}
