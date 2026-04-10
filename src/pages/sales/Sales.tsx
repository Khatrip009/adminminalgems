// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Download,
  FileText,
  Receipt,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  X,
  Save,
  Users,
  Hammer,
  Filter,
  Calendar,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
} from "lucide-react";

// API imports
import {
  listSalesItems,
  deleteSalesItem,
  exportSalesItemsCSV,
  exportSalesItemsExcel,
  exportSalesRegisterPDF,
  exportSalesInvoicePDF,
  importSalesItemsCSV,
  createSalesItem,
  updateSalesItem,
  getSalesItem,
  exportSelectedSalesExcel,
  exportSelectedSalesPDF,
  groupSalesByCustomer,
  groupSalesByCraftsman,
  type SalesItemPayload,
  type DiamondInput,
} from "@/api/sales/sales.api";

// Masters API
import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";
import { getAssetUrl } from "@/utils/assetUrl";

/* =========================================================
   TYPES
========================================================= */

interface Diamond {
  pcs: number;
  carat: number;
  rate: number;
  amount?: number;
  type?: string;
  packet_no?: string | null;
}

interface Sale {
  id: string;
  number: string;
  item: string;
  product_id?: string | null;
  product_image_url?: string | null;
  diamonds: Diamond[];
  diamond_pcs: number;
  diamond_carat: number;
  total_diamond_price: number;
  gold: number;
  gold_carat: number;
  gold_rate: number;
  gold_price: number;
  labour_charge: number;
  total_making_cost: number;
  profit_percent: number;
  profit_amount: number;
  selling_price: number;
  customer_id?: string | null;
  customer_name?: string;
  craftsman_id?: string | null;
  craftsman_name?: string;
  created_at: string;
}

interface SaleFormValues {
  number: string;
  item: string;
  product_id?: string | null;
  diamonds: DiamondInput[];
  gold: number;
  gold_carat: number;
  gold_rate: number;
  gold_price: number;
  labour_charge: number;
  profit_percent: number;
  customer_id?: string | null;
  customer_name?: string;
  craftsman_id?: string | null;
  craftsman_name?: string;
  product_image?: FileList | null;
}

/* =========================================================
   HELPERS
========================================================= */

const money = (v?: number | string) =>
  v === null || v === undefined || isNaN(Number(v))
    ? "—"
    : `₹${Number(v).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const dateFmt = (d: string) => new Date(d).toLocaleDateString("en-IN");

// Auto-calculate gold price
const calculateGoldPrice = (gold: number, goldRate: number) => {
  return gold * goldRate;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Sales: React.FC = () => {
  /* ================= STATE ================= */
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [craftsmanFilter, setCraftsmanFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<keyof Sale>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = 20;
  const [count, setCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Grouping modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupData, setGroupData] = useState<any[]>([]);
  const [groupType, setGroupType] = useState<"customer" | "craftsman">("customer");
  const [groupLoading, setGroupLoading] = useState(false);

  // Masters data for filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [craftsmen, setCraftsmen] = useState<any[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // File input ref for import
  const fileRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     LOAD MASTERS
  ========================================================= */
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [custRes, craftRes] = await Promise.all([
          listCustomers({ limit: 1000 }),
          listCraftsmen({ limit: 1000 }),
        ]);
        if (custRes?.ok) setCustomers(custRes.results || []);
        if (craftRes?.ok) setCraftsmen(craftRes.results || []);
      } catch (error) {
        console.error("Failed to load masters for filters", error);
      }
    };
    loadMasters();
  }, []);

  /* =========================================================
     LOAD SALES (with server-side sorting & filtering)
  ========================================================= */
  const loadSales = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        search: search || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
        sortBy: sortKey,
        order: sortDir.toUpperCase(),
      };
      if (customerFilter) params.customer_id = customerFilter;
      if (craftsmanFilter) params.craftsman_id = craftsmanFilter;

      const r: any = await listSalesItems(params);

      if (!r?.ok) throw new Error("Failed to load sales");

      const normalized = (r.results || []).map((s: any) => {
        let diamonds = [];
        try {
          diamonds =
            typeof s.diamonds === "string"
              ? JSON.parse(s.diamonds)
              : s.diamonds || [];
        } catch {
          diamonds = [];
        }
        return { ...s, diamonds };
      });

      setItems(normalized);
      setCount(r.count || 0);
    } catch (error) {
      toast.error("Failed to load sales");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, customerFilter, craftsmanFilter, page, limit, sortKey, sortDir]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /* =========================================================
     RESET FILTERS
  ========================================================= */
  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("");
    setCraftsmanFilter("");
    setPage(1);
  };

  /* =========================================================
     SORTING
  ========================================================= */
  const handleSort = (key: keyof Sale) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  /* =========================================================
     SELECTION
  ========================================================= */
  const toggleSelectAll = () => {
    if (selectedRows.size === items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  /* =========================================================
     EXPORT / IMPORT
  ========================================================= */
  const download = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const safeDownload = async (fn: () => Promise<Blob>, filename: string) => {
    try {
      toast.loading("Preparing download...", { id: "download" });
      const blob = await fn();
      download(blob, filename);
      toast.success("Download complete", { id: "download" });
    } catch (error) {
      toast.error("Download failed", { id: "download" });
      console.error(error);
    }
  };

  const handleImport = async (file: File) => {
    if (!file) return;
    
    try {
      toast.loading("Importing...", { id: "import" });
      const r = await importSalesItemsCSV(file);
      if (!r?.ok) throw new Error();
      toast.success(`Import successful: ${r.imported || 0} records`, { id: "import" });
      loadSales();
    } catch (error) {
      toast.error("Import failed", { id: "import" });
      console.error(error);
    }
  };

  const exportSelected = async (type: "excel" | "pdf") => {
    if (selectedRows.size === 0) {
      toast.error("No rows selected");
      return;
    }
    const ids = Array.from(selectedRows);
    try {
      toast.loading(`Exporting selected ${type.toUpperCase()}...`, { id: "export" });
      let blob: Blob;
      if (type === "excel") {
        blob = await exportSelectedSalesExcel(ids);
        download(blob, `selected_sales_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        blob = await exportSelectedSalesPDF(ids);
        download(blob, `selected_sales_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      toast.success("Export complete", { id: "export" });
    } catch (error) {
      toast.error("Export failed", { id: "export" });
      console.error(error);
    }
  };

  /* =========================================================
     GROUPING MODAL
  ========================================================= */
  const showGroup = async (type: "customer" | "craftsman") => {
    try {
      setGroupLoading(true);
      setGroupType(type);
      const result = type === "customer"
        ? await groupSalesByCustomer()
        : await groupSalesByCraftsman();
      if (result?.ok) {
        setGroupData(result.results || []);
        setShowGroupModal(true);
      } else {
        toast.error("Failed to load grouping data");
      }
    } catch (error) {
      toast.error("Error loading grouping");
      console.error(error);
    } finally {
      setGroupLoading(false);
    }
  };

  /* =========================================================
     MODAL HANDLERS
  ========================================================= */
  const openCreateModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 lg:px-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logo_minalgems.png" 
                className="h-12 w-auto object-contain" 
                alt="Minal Gems" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Sales Register</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and track all sales transactions</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button
                onClick={() => safeDownload(exportSalesItemsCSV, `sales_${new Date().toISOString().split('T')[0]}.csv`)}
                className="btn-green inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download size={16} /> CSV
              </button>
              <button
                onClick={() => safeDownload(exportSalesItemsExcel, `sales_${new Date().toISOString().split('T')[0]}.xlsx`)}
                className="btn-green inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download size={16} /> Excel
              </button>
              <button
                onClick={() => safeDownload(exportSalesRegisterPDF, `sales_register_${new Date().toISOString().split('T')[0]}.pdf`)}
                className="btn-red inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <FileText size={16} /> Register PDF
              </button>
              <button
                onClick={() => exportSelected("excel")}
                className="btn-blue inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={selectedRows.size === 0}
              >
                <Download size={16} /> Selected Excel
              </button>
              <button
                onClick={() => exportSelected("pdf")}
                className="btn-blue inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={selectedRows.size === 0}
              >
                <FileText size={16} /> Selected PDF
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-purple inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Import CSV
              </button>
              <input
                type="file"
                ref={fileRef}
                hidden
                accept=".csv"
                onChange={(e) => e.target.files && handleImport(e.target.files[0])}
              />
              <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Plus size={16} /> New Sale
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <span className="font-medium">Advanced Filters</span>
              {(search || fromDate || toDate || customerFilter || craftsmanFilter) && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">Active</span>
              )}
            </div>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showFilters && (
            <div className="p-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search invoice / item..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="From Date"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="To Date"
                  />
                </div>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={craftsmanFilter}
                  onChange={(e) => setCraftsmanFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Craftsmen</option>
                  {craftsmen.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={loadSales} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    Apply
                  </button>
                  <button onClick={resetFilters} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => showGroup("customer")} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            <Users size={16} /> Group by Customer
          </button>
          <button onClick={() => showGroup("craftsman")} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
            <Hammer size={16} /> Group by Craftsman
          </button>
          {selectedRows.size > 0 && (
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg">
              {selectedRows.size} row(s) selected
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-b text-center w-12">
                    <button onClick={toggleSelectAll} className="hover:opacity-70">
                      {selectedRows.size === items.length && items.length > 0 ? (
                        <CheckSquare size={18} className="text-indigo-600" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 border-b w-10"></th>
                  <th onClick={() => handleSort("number")} className="cursor-pointer p-3 border-b hover:bg-gray-200 transition">
                    Invoice #
                  </th>
                  <th className="p-3 border-b">Image</th>
                  <th className="p-3 border-b">Item</th>
                  <th className="p-3 border-b">Dia Pcs</th>
                  <th className="p-3 border-b">Dia Ct</th>
                  <th className="p-3 border-b">Diamond ₹</th>
                  <th className="p-3 border-b">Gold (g)</th>
                  <th className="p-3 border-b">Gold Carat</th>
                  <th className="p-3 border-b">Gold Rate</th>
                  <th className="p-3 border-b">Gold ₹</th>
                  <th className="p-3 border-b">Making</th>
                  <th className="p-3 border-b">Profit</th>
                  <th className="p-3 border-b">Selling</th>
                  <th className="p-3 border-b">Customer</th>
                  <th className="p-3 border-b">Craftsman</th>
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">Invoice</th>
                  <th className="p-3 border-b">Edit</th>
                  <th className="p-3 border-b">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={21} className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="mt-2 text-gray-500">Loading...</p>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="p-8 text-center text-gray-500">
                      No sales records found
                    </td>
                  </tr>
                ) : (
                  items.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="p-3 border-b text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(sale.id)}
                            onChange={() => toggleSelectRow(sale.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-3 border-b text-center">
                          <button
                            onClick={() => {
                              const next = new Set(expanded);
                              next.has(sale.id) ? next.delete(sale.id) : next.add(sale.id);
                              setExpanded(next);
                            }}
                            className="hover:bg-gray-200 p-1 rounded"
                          >
                            {expanded.has(sale.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="p-3 border-b font-medium">{sale.number}</td>
                        <td className="p-3 border-b">
                          {sale.product_image_url && (
                            <img
                              src={
                                sale.product_image_url?.startsWith("http")
                                  ? sale.product_image_url
                                  : `${import.meta.env.VITE_API_BASE_URL}${sale.product_image_url}`
                              }
                              className="h-10 w-10 object-cover rounded"
                              alt="product"
                            />
                          )}
                        </td>
                        <td className="p-3 border-b max-w-xs truncate">{sale.item}</td>
                        <td className="p-3 border-b text-center">{sale.diamond_pcs}</td>
                        <td className="p-3 border-b text-right">{Number(sale.diamond_carat).toFixed(3)}</td>
                        <td className="p-3 border-b text-right">{money(sale.total_diamond_price)}</td>
                        <td className="p-3 border-b text-right">{Number(sale.gold).toFixed(3)}</td>
                        <td className="p-3 border-b text-right">{Number(sale.gold_carat).toFixed(1)}</td>
                        <td className="p-3 border-b text-right">{money(sale.gold_rate)}</td>
                        <td className="p-3 border-b text-right">{money(sale.gold_price)}</td>
                        <td className="p-3 border-b text-right">{money(sale.total_making_cost)}</td>
                        <td className={`p-3 border-b text-right font-semibold ${sale.profit_amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {money(sale.profit_amount)}
                        </td>
                        <td className="p-3 border-b text-right font-bold text-gray-800">{money(sale.selling_price)}</td>
                        <td className="p-3 border-b max-w-xs truncate">{sale.customer_name || "—"}</td>
                        <td className="p-3 border-b">{sale.craftsman_name || "—"}</td>
                        <td className="p-3 border-b whitespace-nowrap">{dateFmt(sale.created_at)}</td>
                        <td className="p-3 border-b text-center">
                          <button
                            onClick={() =>
                              safeDownload(
                                () => exportSalesInvoicePDF(sale.id),
                                `invoice-${sale.number}.pdf`
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-800 transition"
                            title="Download Invoice"
                          >
                            <Receipt size={18} />
                          </button>
                        </td>
                        <td className="p-3 border-b text-center">
                          <button onClick={() => openEditModal(sale.id)} className="text-blue-600 hover:text-blue-800 transition" title="Edit">
                            <Pencil size={18} />
                          </button>
                        </td>
                        <td className="p-3 border-b text-center">
                          <button
                            onClick={async () => {
                              if (confirm("Delete this sale record?")) {
                                try {
                                  await deleteSalesItem(sale.id);
                                  toast.success("Sale deleted");
                                  loadSales();
                                } catch {
                                  toast.error("Delete failed");
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                      {expanded.has(sale.id) && (
                        <tr>
                          <td colSpan={21} className="bg-gray-50 p-4 border-b">
                            <h4 className="font-semibold mb-2 text-gray-700">Diamond Details</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="border p-2 text-left">Pcs</th>
                                    <th className="border p-2 text-left">Carat</th>
                                    <th className="border p-2 text-left">Rate</th>
                                    <th className="border p-2 text-left">Amount</th>
                                    <th className="border p-2 text-left">Type</th>
                                    <th className="border p-2 text-left">Packet No</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.diamonds.map((d, i) => (
                                    <tr key={i}>
                                      <td className="border p-2">{d.pcs}</td>
                                      <td className="border p-2">{Number(d.carat).toFixed(3)}</td>
                                      <td className="border p-2">{money(d.rate)}</td>
                                      <td className="border p-2">{money(d.amount)}</td>
                                      <td className="border p-2">{d.type || "Diamond"}</td>
                                      <td className="border p-2">{d.packet_no || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} ({count} total records)
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grouping Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                <h2 className="text-xl font-bold">
                  Group by {groupType === "customer" ? "Customer" : "Craftsman"}
                </h2>
                <button onClick={() => setShowGroupModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {groupLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : groupData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No data available</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-3 text-left">Name</th>
                          <th className="border p-3 text-right">Total Orders</th>
                          <th className="border p-3 text-right">Total Sales</th>
                          {groupType === "craftsman" && (
                            <th className="border p-3 text-right">Total Labour</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {groupData.map((g, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border p-3 font-medium">{g.customer_name || g.craftsman_name}</td>
                            <td className="border p-3 text-right">{g.total_orders}</td>
                            <td className="border p-3 text-right text-green-600 font-semibold">{money(g.total_sales)}</td>
                            {groupType === "craftsman" && (
                              <td className="border p-3 text-right">{money(g.total_labour)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <SaleModal
            editingId={editingId}
            onClose={closeModal}
            onSuccess={loadSales}
          />
        )}
      </div>
    </div>
  );
};

/* =========================================================
   SALE MODAL (FORM)
========================================================= */

interface SaleModalProps {
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SaleModal: React.FC<SaleModalProps> = ({ editingId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [craftsmen, setCraftsmen] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SaleFormValues>({
    defaultValues: {
      number: "",
      item: "",
      product_id: null,
      diamonds: [{ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" }],
      gold: 0,
      gold_carat: 0,
      gold_rate: 0,
      gold_price: 0,
      labour_charge: 0,
      profit_percent: 0,
      customer_id: null,
      customer_name: "",
      craftsman_id: null,
      craftsman_name: "",
      product_image: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "diamonds",
  });

  const watchGold = watch("gold");
  const watchGoldRate = watch("gold_rate");
  const watchGoldPrice = watch("gold_price");
  const watchProductId = watch("product_id");

  // Auto-calculate gold price when gold or gold_rate changes
  useEffect(() => {
    if (watchGold && watchGoldRate && !watchGoldPrice) {
      const calculated = watchGold * watchGoldRate;
      setValue("gold_price", calculated);
    }
  }, [watchGold, watchGoldRate, watchGoldPrice, setValue]);

  // Load master data (products, customers, craftsmen)
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [prodRes, custRes, craftRes] = await Promise.all([
          fetchProductsAdmin({ limit: 100 }),
          listCustomers({ limit: 100 }),
          listCraftsmen({ limit: 100 }),
        ]);
        if (prodRes?.ok) setProducts(prodRes.products || []);
        if (custRes?.ok) setCustomers(custRes.results || []);
        if (craftRes?.ok) setCraftsmen(craftRes.results || []);
      } catch (error) {
        toast.error("Failed to load master data");
      }
    };
    loadMasters();
  }, []);

  // Load sale data if editing
  useEffect(() => {
    if (editingId) {
      setLoading(true);
      getSalesItem(editingId)
        .then((res: any) => {
          if (res?.ok && res.result) {
            const sale = res.result;
            let diamondsArray = [];
            try {
              diamondsArray = typeof sale.diamonds === "string" ? JSON.parse(sale.diamonds) : sale.diamonds || [];
            } catch {
              diamondsArray = [];
            }
            reset({
              number: sale.number,
              item: sale.item,
              product_id: sale.product_id,
              diamonds: diamondsArray.map((d: any) => ({
                pcs: d.pcs,
                carat: d.carat,
                rate: d.rate,
                type: d.type || "Diamond",
                packet_no: d.packet_no || "",
              })),
              gold: Number(sale.gold) || 0,
              gold_carat: Number(sale.gold_carat) || 0,
              gold_rate: Number(sale.gold_rate) || 0,
              gold_price: Number(sale.gold_price) || 0,
              labour_charge: Number(sale.labour_charge) || 0,
              profit_percent: Number(sale.profit_percent) || 0,
              customer_id: sale.customer_id,
              customer_name: sale.customer_name || "",
              craftsman_id: sale.craftsman_id,
              craftsman_name: sale.craftsman_name || "",
            });
            if (sale.product_image_url) {
              setImagePreview(sale.product_image_url);
            }
          } else {
            toast.error("Failed to load sale details");
            onClose();
          }
        })
        .catch(() => {
          toast.error("Error loading sale");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [editingId, reset, onClose]);

  // ✅ NEW: Auto-fill product data when product selection changes
  useEffect(() => {
    if (!watchProductId) return;
    const selectedProduct = products.find((p) => p.id === watchProductId);
    if (!selectedProduct) return;

    // Set item name from product title
    setValue("item", selectedProduct.title);

    // Set gold carat from product (default 18 if not present)
    setValue("gold_carat", selectedProduct.gold_carat || 18);

    // Populate diamonds array from product's diamonds JSON
    let productDiamonds: any[] = [];
    if (selectedProduct.diamonds && Array.isArray(selectedProduct.diamonds)) {
      productDiamonds = selectedProduct.diamonds;
    } else if (typeof selectedProduct.diamonds === "string") {
      try {
        productDiamonds = JSON.parse(selectedProduct.diamonds);
      } catch {
        productDiamonds = [];
      }
    }

    if (productDiamonds.length > 0) {
      // Replace the existing diamonds array with product diamonds
      const mapped = productDiamonds.map((d: any) => ({
        pcs: d.pcs || 0,
        carat: d.carat || 0,
        rate: d.rate || 0,
        type: d.type || "Diamond",
        packet_no: d.packet_no || "",
      }));
      // Since useFieldArray doesn't have a direct replaceAll, we remove all and append
      const currentLength = fields.length;
      for (let i = 0; i < currentLength; i++) {
        remove(0);
      }
      mapped.forEach((d) => append(d));
    } else {
      // If product has no diamonds, keep default empty entry
      const currentLength = fields.length;
      if (currentLength === 0) {
        append({ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" });
      }
    }

    // Set product image preview from product's primary_image
    if (selectedProduct.primary_image) {
      const imgUrl = getAssetUrl(selectedProduct.primary_image);
      setImagePreview(imgUrl);
    } else {
      setImagePreview(null);
    }
  }, [watchProductId, products, setValue, fields.length, remove, append]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    const customer = customers.find((c) => c.id === custId);
    if (customer) {
      setValue("customer_id", customer.id);
      setValue("customer_name", customer.name);
    } else {
      setValue("customer_id", null);
      setValue("customer_name", "");
    }
  };

  const handleCraftsmanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const craftId = e.target.value;
    const craftsman = craftsmen.find((c) => c.id === craftId);
    if (craftsman) {
      setValue("craftsman_id", craftsman.id);
      setValue("craftsman_name", craftsman.name);
    } else {
      setValue("craftsman_id", null);
      setValue("craftsman_name", "");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SaleFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("number", data.number);
      formData.append("item", data.item);
      formData.append("diamonds", JSON.stringify(data.diamonds));
      formData.append("gold", String(data.gold || 0));
      formData.append("gold_carat", String(data.gold_carat || 0));
      formData.append("gold_rate", String(data.gold_rate || 0));
      formData.append("gold_price", String(data.gold_price || 0));
      formData.append("labour_charge", String(data.labour_charge || 0));
      formData.append("profit_percent", String(data.profit_percent || 0));
      
      if (data.product_id) formData.append("product_id", data.product_id);
      if (data.customer_id) formData.append("customer_id", data.customer_id);
      if (data.customer_name) formData.append("customer_name", data.customer_name);
      if (data.craftsman_id) formData.append("craftsman_id", data.craftsman_id);
      if (data.craftsman_name) formData.append("craftman", data.craftsman_name);
      
      if (data.product_image && data.product_image[0]) {
        formData.append("product_image", data.product_image[0]);
      }

      let res;
      if (editingId) {
        res = await updateSalesItem(editingId, formData);
      } else {
        res = await createSalesItem(formData);
      }

      if (res?.ok) {
        toast.success(editingId ? "Sale updated successfully" : "Sale created successfully");
        onSuccess();
        onClose();
      } else {
        toast.error("Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && editingId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{editingId ? "Edit Sale" : "New Sale"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number *</label>
              <input
                {...register("number", { required: "Invoice number is required" })}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="INV-001"
              />
              {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                {...register("product_id")}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Product (auto-fills details) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Item Description *</label>
              <input
                {...register("item", { required: "Item description is required" })}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Gold ring with diamonds..."
              />
              {errors.item && <p className="text-red-500 text-xs mt-1">{errors.item.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                onChange={handleCustomerChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                value={watch("customer_id") || ""}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or Enter Customer Name</label>
              <input
                {...register("customer_name")}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Craftsman</label>
              <select
                onChange={handleCraftsmanChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                value={watch("craftsman_id") || ""}
              >
                <option value="">-- Select Craftsman --</option>
                {craftsmen.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or Enter Craftsman Name</label>
              <input
                {...register("craftsman_name")}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Craftsman name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                {...register("product_image")}
                onChange={handleImageChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
              )}
            </div>
          </div>

          {/* Diamonds Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Diamonds</h3>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 items-end">
                  <div>
                    <label className="block text-xs">Pcs *</label>
                    <input
                      type="number"
                      {...register(`diamonds.${index}.pcs` as const, { valueAsNumber: true, min: 1 })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs">Carat *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`diamonds.${index}.carat` as const, { valueAsNumber: true })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs">Rate *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`diamonds.${index}.rate` as const, { valueAsNumber: true })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs">Type</label>
                    <input
                      {...register(`diamonds.${index}.type` as const)}
                      className="w-full border rounded p-1"
                      placeholder="Diamond"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs">Packet No</label>
                    <input
                      {...register(`diamonds.${index}.packet_no` as const)}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 p-1 mt-4"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" })}
                className="text-indigo-600 text-sm flex items-center gap-1 mt-2 hover:text-indigo-700"
              >
                <Plus size={16} /> Add Diamond
              </button>
            </div>
          </div>

          {/* Gold & Pricing */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Gold & Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gold Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("gold", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gold Carat</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("gold_carat", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2"
                  placeholder="22"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gold Rate (₹/g)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("gold_rate", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gold Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("gold_price", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated from weight × rate</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Labour Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("labour_charge", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Profit Percent (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("profit_percent", { valueAsNumber: true })}
                  className="w-full border rounded-lg p-2"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-4 flex justify-end gap-2 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> {editingId ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sales;