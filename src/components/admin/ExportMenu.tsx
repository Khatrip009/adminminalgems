// src/components/admin/ExportMenu.tsx
import { useState } from "react";
import {
  Download,
  FileText,
  Package,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
} from "lucide-react";

import {
  exportOrdersPDF,
  exportOrdersCSV,
  exportOrdersZIP,
  exportShippingLabelsPDF,
  exportLeadsCSV,
} from "../../api/logistics/export.api";

interface ExportMenuProps {
  orderIds?: string[];
  size?: "sm" | "md";
  mode?: "orders" | "leads" | "shipping";
}

export default function ExportMenu({
  orderIds = [],
  size = "md",
  mode = "orders",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"" | "pdf" | "csv" | "zip" | "labels">("");

  async function handleDownload(action: "pdf" | "csv" | "zip" | "labels") {
    try {
      setLoading(action);

      if (mode === "orders") {
        if (action === "pdf") await exportOrdersPDF();
        if (action === "csv") await exportOrdersCSV();
        if (action === "zip") await exportOrdersZIP();
      }

      if (mode === "leads") {
        if (action === "csv") await exportLeadsCSV();
      }

      if (mode === "shipping") {
        if (action === "labels") await exportShippingLabelsPDF();
      }
    } catch (err: any) {
      console.error("Export failed:", err);
      alert(err.message || "Export failed");
    } finally {
      setLoading("");
      setOpen(false);
    }
  }

  const sizeClasses = size === "sm" ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-sm";

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white shadow-sm hover:bg-slate-50 ${sizeClasses}`}
      >
        <Download size={16} />
        Export
        <ChevronDown size={16} />
      </button>

      {open && (
        <>
          {/* backdrop to close on click outside (touch friendly) */}
          <div
            className="fixed inset-0 z-10 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute z-20 mt-2 rounded-lg bg-white shadow-xl border border-slate-200 p-1 ${
              // On mobile: full width with margins, right‑aligned on desktop
              "left-0 right-0 sm:left-auto sm:right-0 w-full sm:w-60"
            }`}
          >
            {mode === "orders" && (
              <>
                <button
                  onClick={() => handleDownload("pdf")}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
                >
                  {loading === "pdf" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                  Orders PDF
                </button>

                <button
                  onClick={() => handleDownload("csv")}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
                >
                  {loading === "csv" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  Orders CSV
                </button>

                <button
                  onClick={() => handleDownload("zip")}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
                >
                  {loading === "zip" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Package size={16} />
                  )}
                  Orders ZIP
                </button>
              </>
            )}

            {mode === "leads" && (
              <button
                onClick={() => handleDownload("csv")}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
              >
                {loading === "csv" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                Leads CSV
              </button>
            )}

            {mode === "shipping" && (
              <button
                onClick={() => handleDownload("labels")}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
              >
                {loading === "labels" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Package size={16} />
                )}
                Shipping Labels PDF
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}