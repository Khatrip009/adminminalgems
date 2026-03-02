// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Edit,
  Search,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  listSalesItems,
  createSalesItem,
  updateSalesItem,
  deleteSalesItem,
  exportSalesItemsCSV,
  exportSalesItemsExcel,
  exportSalesRegisterPDF,
  exportSalesInvoicePDF,
} from "@/api/sales/sales.api";

import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";

/* =========================================================
   TYPES
========================================================= */

interface Diamond {
  pcs: number;
  carat: number;
  rate: number;
  amount?: number;
  type?: string;
  quality?: string | null;
}

interface Sale {
  id: number;
  number: string;
  item: string;
  product_image_url?: string | null;
  diamonds: Diamond[];
  diamond_pcs: number;
  diamond_carat: number;
  total_diamond_price: number;
  gold: number;
  gold_price: number;
  labour_charge: number;
  total_making_cost: number;
  profit_percent: number;
  profit_amount: number;
  selling_price: number;
  product_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  craftsman_id?: string | null;
  craftsman_name?: string | null;
  created_at: string;
}

interface Option {
  id: string;
  name: string;
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

const dateFmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* =========================================================
   COMPONENT
========================================================= */

const Sales: React.FC = () => {
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Master data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [craftsmen, setCraftsmen] = useState<Option[]>([]);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [manualItem, setManualItem] = useState("");
  const [useManualProduct, setUseManualProduct] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualCustomer, setManualCustomer] = useState("");
  const [useManualCustomer, setUseManualCustomer] = useState(false);

  const [selectedCraftsmanId, setSelectedCraftsmanId] = useState("");
  const [manualCraftsman, setManualCraftsman] = useState("");
  const [useManualCraftsman, setUseManualCraftsman] = useState(false);

  // Diamonds
  const [diamonds, setDiamonds] = useState<Diamond[]>([
    { pcs: 1, carat: 0, rate: 0, type: "Default", quality: null },
  ]);

  // Gold & costs
  const [gold, setGold] = useState(0);
  const [goldPrice, setGoldPrice] = useState(0);
  const [labourCharge, setLabourCharge] = useState(0);
  const [profitPercent, setProfitPercent] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Calculations
  const totalDiamondPrice = diamonds.reduce(
    (sum, d) => sum + (d.carat * d.rate),
    0
  );
  const totalDiamondPcs = diamonds.reduce((sum, d) => sum + d.pcs, 0);
  const totalDiamondCarat = diamonds.reduce((sum, d) => sum + d.carat, 0);
  const totalMakingCost = totalDiamondPrice + goldPrice + labourCharge;

  // Update profit amount when percent changes
  useEffect(() => {
    const newProfitAmount = (totalMakingCost * profitPercent) / 100;
    setProfitAmount(newProfitAmount);
    setSellingPrice(totalMakingCost + newProfitAmount);
  }, [profitPercent, totalMakingCost]);

  // Update profit percent when amount changes (manual edit)
  const handleProfitAmountChange = (value: number) => {
    setProfitAmount(value);
    if (totalMakingCost > 0) {
      const newPercent = (value / totalMakingCost) * 100;
      setProfitPercent(newPercent);
    }
    setSellingPrice(totalMakingCost + value);
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const r = await listSalesItems({ search, page, limit });
      if (!r.ok) throw r;
      setItems(r.results);
      setCount(r.count);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    (async () => {
      const [p, c, cr] = await Promise.all([
        fetchProductsAdmin({ limit: 500 }),
        listCustomers({ limit: 500 }),
        listCraftsmen({ limit: 500 }),
      ]);
      setProducts(p.products || []);
      setCustomers((c.results || []).map((x: any) => ({ id: x.id, name: x.name })));
      setCraftsmen((cr.results || []).map((x: any) => ({ id: x.id, name: x.name })));
    })();
  }, []);

  /* =========================================================
     FORM HANDLERS
  ========================================================= */

  const resetForm = () => {
    setEditing(null);
    setShowModal(false);
    setUseManualProduct(false);
    setSelectedProductId("");
    setManualItem("");
    setUseManualCustomer(false);
    setSelectedCustomerId("");
    setManualCustomer("");
    setUseManualCraftsman(false);
    setSelectedCraftsmanId("");
    setManualCraftsman("");
    setDiamonds([{ pcs: 1, carat: 0, rate: 0, type: "Default", quality: null }]);
    setGold(0);
    setGoldPrice(0);
    setLabourCharge(0);
    setProfitPercent(0);
    setProfitAmount(0);
    setSellingPrice(0);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEdit = (sale: Sale) => {
    setEditing(sale);
    setSelectedProductId(sale.product_id || "");
    setManualItem(sale.item);
    setUseManualProduct(!sale.product_id);
    setSelectedCustomerId(sale.customer_id || "");
    setManualCustomer(sale.customer_name || "");
    setUseManualCustomer(!sale.customer_id);
    setSelectedCraftsmanId(sale.craftsman_id || "");
    setManualCraftsman(sale.craftsman_name || "");
    setUseManualCraftsman(!sale.craftsman_id);
    setDiamonds(sale.diamonds.length ? sale.diamonds : [{ pcs: 1, carat: 0, rate: 0, type: "Default", quality: null }]);
    setGold(sale.gold);
    setGoldPrice(sale.gold_price);
    setLabourCharge(sale.labour_charge);
    setProfitPercent(sale.profit_percent);
    setProfitAmount(sale.profit_amount);
    setSellingPrice(sale.selling_price);
    setImagePreview(sale.product_image_url ? `${import.meta.env.VITE_API_BASE_URL}${sale.product_image_url}` : null);
    setShowModal(true);
  };

  const buildPayload = (form: HTMLFormElement) => {
    const fd = new FormData(form);

    // Item
    if (useManualProduct) {
      fd.set("item", manualItem);
      fd.delete("product_id");
    } else {
      fd.set("product_id", selectedProductId);
      // item will be taken from product on backend
      fd.delete("item");
    }

    // Customer
    if (useManualCustomer) {
      fd.set("customer_name", manualCustomer);
      fd.delete("customer_id");
    } else {
      fd.set("customer_id", selectedCustomerId);
      fd.delete("customer_name");
    }

    // Craftsman
    if (useManualCraftsman) {
      fd.set("craftman", manualCraftsman);
      fd.delete("craftsman_id");
    } else {
      fd.set("craftsman_id", selectedCraftsmanId);
      fd.delete("craftman");
    }

    // Diamonds
    const diamondsPayload = diamonds.map(d => ({
      ...d,
      amount: d.carat * d.rate,
    }));
    fd.append("diamonds", JSON.stringify(diamondsPayload));

    // Costs
    fd.set("gold", String(gold));
    fd.set("gold_price", String(goldPrice));
    fd.set("labour_charge", String(labourCharge));
    fd.set("profit_percent", String(profitPercent));
    fd.set("profit_amount", String(profitAmount)); // computed, but backend may recalc

    return fd;
  };

  const submitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const fd = buildPayload(e.currentTarget);
      const r = await createSalesItem(fd);
      if (!r.ok) throw r;
      toast.success("Sale created");
      resetForm();
      loadSales();
    } catch {
      toast.error("Create failed");
    }
  };

  const submitUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const fd = buildPayload(e.currentTarget);
      const r = await updateSalesItem(String(editing.id), fd);
      if (!r.ok) throw r;
      toast.success("Sale updated");
      resetForm();
      loadSales();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const r = await deleteSalesItem(String(id));
      if (!r.ok) throw r;
      toast.success("Deleted");
      loadSales();
    } catch {
      toast.error("Delete failed");
    }
  };

  const addDiamondRow = () => {
    setDiamonds([...diamonds, { pcs: 1, carat: 0, rate: 0, type: "Default", quality: null }]);
  };

  const removeDiamondRow = (idx: number) => {
    if (diamonds.length === 1) return;
    setDiamonds(diamonds.filter((_, i) => i !== idx));
  };

  const updateDiamond = (idx: number, field: keyof Diamond, value: number | string) => {
    const newDiamonds = [...diamonds];
    (newDiamonds[idx] as any)[field] = value;
    setDiamonds(newDiamonds);
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* =========================================================
     EXPORTS
  ========================================================= */

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow"
          >
            <Plus size={18} /> Add Sale
          </button>
          <button
            onClick={async () => download(await exportSalesItemsCSV(), "sales.csv")}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow"
          >
            <Download size={18} /> CSV
          </button>
          <button
            onClick={async () => download(await exportSalesItemsExcel(), "sales.xlsx")}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow"
          >
            <Download size={18} /> Excel
          </button>
          <button
            onClick={async () => download(await exportSalesRegisterPDF(), "sales-register.pdf")}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition shadow"
          >
            <FileText size={18} /> Register PDF
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by number, item, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-3 w-8"></th>
              <th className="p-3 text-left">Invoice No</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-right">Selling Price</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Invoice</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="p-3">
                    <button
                      onClick={() => toggleRow(sale.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedRows.has(sale.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                  <td className="p-3 font-medium">{sale.number}</td>
                  <td className="p-3">{sale.item}</td>
                  <td className="p-3">{sale.customer_name}</td>
                  <td className="p-3 text-right font-semibold">{money(sale.selling_price)}</td>
                  <td className="p-3">{dateFmt(sale.created_at)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={async () =>
                        download(await exportSalesInvoicePDF(String(sale.id)), `invoice-${sale.number}.pdf`)
                      }
                      className="text-blue-600 hover:text-blue-800"
                      title="Download Invoice"
                    >
                      <Receipt size={18} />
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(sale)}
                        className="text-amber-600 hover:text-amber-800"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(sale.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="p-4">
                      <div className="border rounded-lg bg-white p-4">
                        <h4 className="font-semibold mb-2 text-gray-700">Diamond Details</h4>
                        {sale.diamonds.length === 0 ? (
                          <p className="text-gray-500 italic">No diamonds</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left">Pcs</th>
                                <th className="p-2 text-left">Carat</th>
                                <th className="p-2 text-left">Rate (₹)</th>
                                <th className="p-2 text-left">Amount (₹)</th>
                                <th className="p-2 text-left">Type</th>
                                <th className="p-2 text-left">Quality</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.diamonds.map((d, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="p-2">{d.pcs}</td>
                                  <td className="p-2">{d.carat}</td>
                                  <td className="p-2">{money(d.rate)}</td>
                                  <td className="p-2">{money(d.amount)}</td>
                                  <td className="p-2">{d.type || "Default"}</td>
                                  <td className="p-2">{d.quality || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">No sales found</div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={editing ? submitUpdate : submitCreate}>
              {/* Modal Header with Logo */}
              <div className="flex justify-between items-center p-6 border-b">
                <div className="flex items-center gap-3">
                  <img src="/logo_minalgems.png" alt="Minal Gems" className="h-10 w-auto" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editing ? "Edit Sale" : "New Sale"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Product / Item */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product / Item *</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="productType"
                        checked={!useManualProduct}
                        onChange={() => setUseManualProduct(false)}
                      />
                      <span>Select Product</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="productType"
                        checked={useManualProduct}
                        onChange={() => setUseManualProduct(true)}
                      />
                      <span>Manual Entry</span>
                    </label>
                  </div>
                  {!useManualProduct ? (
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select a product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.style_code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualItem}
                      onChange={(e) => setManualItem(e.target.value)}
                      placeholder="Enter item name"
                      required
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>

                {/* Customer */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer *</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!useManualCustomer}
                        onChange={() => setUseManualCustomer(false)}
                      />
                      <span>Select Customer</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={useManualCustomer}
                        onChange={() => setUseManualCustomer(true)}
                      />
                      <span>Manual Entry</span>
                    </label>
                  </div>
                  {!useManualCustomer ? (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualCustomer}
                      onChange={(e) => setManualCustomer(e.target.value)}
                      placeholder="Enter customer name"
                      required
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>

                {/* Craftsman */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Craftsman *</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!useManualCraftsman}
                        onChange={() => setUseManualCraftsman(false)}
                      />
                      <span>Select Craftsman</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={useManualCraftsman}
                        onChange={() => setUseManualCraftsman(true)}
                      />
                      <span>Manual Entry</span>
                    </label>
                  </div>
                  {!useManualCraftsman ? (
                    <select
                      value={selectedCraftsmanId}
                      onChange={(e) => setSelectedCraftsmanId(e.target.value)}
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select a craftsman</option>
                      {craftsmen.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualCraftsman}
                      onChange={(e) => setManualCraftsman(e.target.value)}
                      placeholder="Enter craftsman name"
                      required
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>

                {/* Diamonds Table */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diamonds</label>
                  <div className="border rounded overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">Pcs</th>
                          <th className="p-2">Carat</th>
                          <th className="p-2">Rate (₹)</th>
                          <th className="p-2">Amount (₹)</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Quality</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {diamonds.map((d, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-1">
                              <input
                                type="number"
                                min="1"
                                value={d.pcs}
                                onChange={(e) => updateDiamond(idx, "pcs", parseInt(e.target.value) || 0)}
                                className="w-16 p-1 border rounded"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={d.carat}
                                onChange={(e) => updateDiamond(idx, "carat", parseFloat(e.target.value) || 0)}
                                className="w-20 p-1 border rounded"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={d.rate}
                                onChange={(e) => updateDiamond(idx, "rate", parseFloat(e.target.value) || 0)}
                                className="w-24 p-1 border rounded"
                              />
                            </td>
                            <td className="p-1 font-medium">
                              {money(d.carat * d.rate)}
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={d.type || ""}
                                onChange={(e) => updateDiamond(idx, "type", e.target.value)}
                                className="w-20 p-1 border rounded"
                                placeholder="Type"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={d.quality || ""}
                                onChange={(e) => updateDiamond(idx, "quality", e.target.value)}
                                className="w-20 p-1 border rounded"
                                placeholder="Quality"
                              />
                            </td>
                            <td className="p-1">
                              <button
                                type="button"
                                onClick={() => removeDiamondRow(idx)}
                                className="text-red-500 hover:text-red-700"
                                disabled={diamonds.length === 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addDiamondRow}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Diamond
                  </button>
                </div>

                {/* Gold & Labour */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gold (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={gold}
                      onChange={(e) => setGold(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gold Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={goldPrice}
                      onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Labour Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={labourCharge}
                      onChange={(e) => setLabourCharge(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>

                {/* Profit & Selling */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profit %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profitPercent}
                      onChange={(e) => setProfitPercent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profit Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profitAmount}
                      onChange={(e) => handleProfitAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      readOnly
                      className="w-full p-2 border rounded bg-gray-100"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Image</label>
                  <div className="flex items-center gap-4 mt-1">
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                    )}
                    <input
                      type="file"
                      ref={fileRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1 p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 p-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editing ? "Update" : "Create"} Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;