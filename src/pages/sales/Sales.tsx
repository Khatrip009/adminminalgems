// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Plus, Trash2, Download, FileText, Edit, Search, X,
  Image as ImageIcon, ChevronLeft, ChevronRight,
} from "lucide-react";

import {
  listSalesItems,
  createSalesItem,
  updateSalesItem,
  deleteSalesItem,
  exportSalesItemsCSV,
  exportSalesItemsPDF,
} from "@/api/sales/sales.api";

import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";

// ---------- Types ----------
interface Sale {
  id: number;
  number: string;
  item: string;
  product_image_url?: string | null;
  diamonds: Array<{
    pcs: number;
    carat: number;
    rate: number;
    amount?: number;
    type?: string;
    quality?: string | null;
  }>;
  diamond_pcs: number;       // aggregated (for display)
  diamond_carat: string;     // aggregated
  total_diamond_price: string;
  gold: string;
  gold_price: string;
  labour_charge: string;
  total_making_cost: string;
  selling_price: string;
  product_id?: string | null;
  product_name?: string | null;
  craftsman_id?: string | null;
  craftsman_name?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface Option {
  id: string;
  name: string;
}

// ---------- Helpers ----------
const formatMoney = (value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  return isNaN(num) ? "—" : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "https://apiminalgems.exotech.co.in/api";

// ---------- Component ----------
const Sales: React.FC = () => {
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [craftsmen, setCraftsmen] = useState<Option[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hybrid mode states
  const [useManualCustomer, setUseManualCustomer] = useState(false);
  const [useManualCraftsman, setUseManualCraftsman] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  // Note: product name is taken from the "item" field, so no manualProductName needed

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualCustomerName, setManualCustomerName] = useState("");

  const [selectedCraftsmanId, setSelectedCraftsmanId] = useState("");
  const [manualCraftsmanName, setManualCraftsmanName] = useState("");

  // Diamond fields (support a single diamond for simplicity – backend accepts array)
  const [diamondPcs, setDiamondPcs] = useState<number>(0);
  const [diamondCarat, setDiamondCarat] = useState<number>(0);
  const [diamondRate, setDiamondRate] = useState<number>(0);

  // ---------- Data fetching ----------
  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      // Backend uses "search", "page", "limit"
      const response = await listSalesItems({
        search: searchTerm || undefined,
        page,
        limit,
      });
      if (!response.ok) throw new Error(response.error || "Failed to load");
      setItems(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      toast.error("Could not load sales items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, limit]);

  const loadMasters = async () => {
    try {
      const [productsRes, customersRes, craftsmenRes] = await Promise.all([
        fetchProductsAdmin({ limit: 500 }),
        listCustomers({ limit: 500 }),
        listCraftsmen({ limit: 500 }),
      ]);

      setProducts(productsRes.products || []);

      const customersList = customersRes.results || customersRes.data?.results || customersRes;
      setCustomers(
        Array.isArray(customersList)
          ? customersList.map((c: any) => ({ id: c.id, name: c.name }))
          : []
      );

      const craftsmenList = craftsmenRes.results || craftsmenRes.data?.results || craftsmenRes;
      setCraftsmen(
        Array.isArray(craftsmenList)
          ? craftsmenList.map((c: any) => ({ id: c.id, name: c.name }))
          : []
      );
    } catch (error) {
      toast.error("Failed to load master data");
    }
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    loadMasters();
  }, []);

  // ---------- Form handling ----------
  const resetForm = () => {
    setUseManualCustomer(false);
    setUseManualCraftsman(false);
    setSelectedProductId("");
    setSelectedCustomerId("");
    setManualCustomerName("");
    setSelectedCraftsmanId("");
    setManualCraftsmanName("");
    setDiamondPcs(0);
    setDiamondCarat(0);
    setDiamondRate(0);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildDiamondsArray = () => {
    // Return an array with one diamond object (or empty if all zeros)
    if (diamondPcs === 0 && diamondCarat === 0 && diamondRate === 0) return [];
    return [
      {
        pcs: diamondPcs,
        carat: diamondCarat,
        rate: diamondRate,
        type: "Default",        // backend may expect type; adjust if needed
        quality: null,
      },
    ];
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const number = formData.get("number") as string;
    const item = formData.get("item") as string;

    if (!number?.trim()) return toast.error("Number is required");
    if (!item?.trim()) return toast.error("Item is required");

    const payload = new FormData();
    payload.append("number", number);
    payload.append("item", item);

    // Diamonds as JSON array
    const diamondsArray = buildDiamondsArray();
    payload.append("diamonds", JSON.stringify(diamondsArray));

    payload.append("gold", formData.get("gold") as string || "0");
    payload.append("gold_price", formData.get("gold_price") as string || "0");
    payload.append("labour_charge", formData.get("labour_charge") as string || "0");

    // Product
    if (selectedProductId) {
      payload.append("product_id", selectedProductId);
    }

    // Customer
    if (useManualCustomer) {
      if (!manualCustomerName.trim()) return toast.error("Customer name is required");
      payload.append("customer_name", manualCustomerName.trim());
    } else {
      if (!selectedCustomerId) return toast.error("Please select a customer");
      payload.append("customer_id", selectedCustomerId);
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) payload.append("customer_name", customer.name); // optional
    }

    // Craftsman
    if (useManualCraftsman) {
      if (!manualCraftsmanName.trim()) return toast.error("Craftsman name is required");
      payload.append("craftman", manualCraftsmanName.trim());
    } else {
      if (!selectedCraftsmanId) return toast.error("Please select a craftsman");
      payload.append("craftsman_id", selectedCraftsmanId);
      const craftsman = craftsmen.find(c => c.id === selectedCraftsmanId);
      if (craftsman) payload.append("craftman", craftsman.name); // optional
    }

    const imageFile = formData.get("product_image") as File;
    if (imageFile && imageFile.size > 0) {
      payload.append("product_image", imageFile);
    }

    try {
      const response = await createSalesItem(payload);
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale created successfully");
      setShowCreateModal(false);
      resetForm();
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Creation failed");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSale) return;

    const formData = new FormData(e.currentTarget);
    const number = formData.get("number") as string;
    const item = formData.get("item") as string;

    if (!number?.trim()) return toast.error("Number is required");
    if (!item?.trim()) return toast.error("Item is required");

    const payload = new FormData();
    payload.append("number", number);
    payload.append("item", item);

    // Diamonds
    const diamondsArray = buildDiamondsArray();
    payload.append("diamonds", JSON.stringify(diamondsArray));

    payload.append("gold", formData.get("gold") as string || "0");
    payload.append("gold_price", formData.get("gold_price") as string || "0");
    payload.append("labour_charge", formData.get("labour_charge") as string || "0");

    // Product
    if (selectedProductId) {
      payload.append("product_id", selectedProductId);
    }

    // Customer
    if (useManualCustomer) {
      if (!manualCustomerName.trim()) return toast.error("Customer name is required");
      payload.append("customer_name", manualCustomerName.trim());
      // Ensure no ID is sent
      payload.append("customer_id", "");
    } else {
      if (!selectedCustomerId) return toast.error("Please select a customer");
      payload.append("customer_id", selectedCustomerId);
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) payload.append("customer_name", customer.name);
    }

    // Craftsman
    if (useManualCraftsman) {
      if (!manualCraftsmanName.trim()) return toast.error("Craftsman name is required");
      payload.append("craftman", manualCraftsmanName.trim());
      payload.append("craftsman_id", "");
    } else {
      if (!selectedCraftsmanId) return toast.error("Please select a craftsman");
      payload.append("craftsman_id", selectedCraftsmanId);
      const craftsman = craftsmen.find(c => c.id === selectedCraftsmanId);
      if (craftsman) payload.append("craftman", craftsman.name);
    }

    const imageFile = formData.get("product_image") as File;
    if (imageFile && imageFile.size > 0) {
      payload.append("product_image", imageFile);
    }

    try {
      const response = await updateSalesItem(String(editingSale.id), payload);
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale updated successfully");
      setEditingSale(null);
      resetForm();
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this sale?")) return;
    try {
      const response = await deleteSalesItem(String(id));
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale deleted");
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  // ---------- Exports ----------
  const handleExportCSV = async () => {
    try {
      const blob = await exportSalesItemsCSV();
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${Date.now()}.csv`;
      a.click();
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportSalesItemsPDF();
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${Date.now()}.pdf`;
      a.click();
      toast.success("PDF exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  // ---------- Image preview ----------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ---------- Edit modal prefill ----------
  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setImagePreview(sale.product_image_url ? `${API_BASE}${sale.product_image_url}` : null);

    // Product
    if (sale.product_id) {
      setSelectedProductId(sale.product_id);
    } else {
      setSelectedProductId("");
    }

    // Customer
    if (sale.customer_id) {
      setUseManualCustomer(false);
      setSelectedCustomerId(sale.customer_id);
      setManualCustomerName("");
    } else {
      setUseManualCustomer(true);
      setSelectedCustomerId("");
      setManualCustomerName(sale.customer_name || "");
    }

    // Craftsman
    if (sale.craftsman_id) {
      setUseManualCraftsman(false);
      setSelectedCraftsmanId(sale.craftsman_id);
      setManualCraftsmanName("");
    } else {
      setUseManualCraftsman(true);
      setSelectedCraftsmanId("");
      setManualCraftsmanName(sale.craftsman_name || "");
    }

    // Diamonds – take first diamond if exists
    if (sale.diamonds && sale.diamonds.length > 0) {
      const d = sale.diamonds[0];
      setDiamondPcs(d.pcs || 0);
      setDiamondCarat(d.carat || 0);
      setDiamondRate(d.rate || 0);
    } else {
      setDiamondPcs(0);
      setDiamondCarat(0);
      setDiamondRate(0);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Sales Management
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Sale</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow"
            >
              <Download size={18} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by number or item..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Craftsman</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  items.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {sale.product_image_url ? (
                          <img
                            src={`${API_BASE}${sale.product_image_url}`}
                            alt={sale.item}
                            className="w-12 h-12 object-cover rounded-md shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.item}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.craftsman_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatMoney(sale.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sale.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(sale)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages} ({totalCount} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSale) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingSale ? "Edit Sale" : "Create Sale"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSale(null);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingSale ? handleUpdate : handleCreate} className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md shadow-sm" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="product_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number *</label>
                  <input
                    type="text"
                    name="number"
                    defaultValue={editingSale?.number || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                {/* Item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <input
                    type="text"
                    name="item"
                    defaultValue={editingSale?.item || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                {/* Product Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product (optional)</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Customer *</label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={useManualCustomer}
                        onChange={(e) => {
                          setUseManualCustomer(e.target.checked);
                          setSelectedCustomerId("");
                          setManualCustomerName("");
                        }}
                        className="rounded"
                      />
                      Manual entry
                    </label>
                  </div>
                  {!useManualCustomer ? (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required={!useManualCustomer}
                    >
                      <option value="">Select Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required={useManualCustomer}
                    />
                  )}
                </div>

                {/* Craftsman */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Craftsman *</label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={useManualCraftsman}
                        onChange={(e) => {
                          setUseManualCraftsman(e.target.checked);
                          setSelectedCraftsmanId("");
                          setManualCraftsmanName("");
                        }}
                        className="rounded"
                      />
                      Manual entry
                    </label>
                  </div>
                  {!useManualCraftsman ? (
                    <select
                      value={selectedCraftsmanId}
                      onChange={(e) => setSelectedCraftsmanId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required={!useManualCraftsman}
                    >
                      <option value="">Select Craftsman</option>
                      {craftsmen.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualCraftsmanName}
                      onChange={(e) => setManualCraftsmanName(e.target.value)}
                      placeholder="Enter craftsman name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required={useManualCraftsman}
                    />
                  )}
                </div>

                {/* Diamond Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Pcs</label>
                  <input
                    type="number"
                    step="1"
                    value={diamondPcs}
                    onChange={(e) => setDiamondPcs(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Carat</label>
                  <input
                    type="number"
                    step="0.01"
                    value={diamondCarat}
                    onChange={(e) => setDiamondCarat(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (per carat)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={diamondRate}
                    onChange={(e) => setDiamondRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                {/* Gold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gold (grams)</label>
                  <input
                    type="number"
                    name="gold"
                    step="0.01"
                    defaultValue={editingSale?.gold || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gold Price (₹)</label>
                  <input
                    type="number"
                    name="gold_price"
                    step="0.01"
                    defaultValue={editingSale?.gold_price || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labour Charge (₹)</label>
                  <input
                    type="number"
                    name="labour_charge"
                    step="0.01"
                    defaultValue={editingSale?.labour_charge || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSale(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                >
                  {editingSale ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind animation class */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Sales;