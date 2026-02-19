// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Edit,
  Upload,
  Search,
  X,
  Save,
} from "lucide-react";

import {
  listSalesItems,
  createSalesItem,
  updateSalesItem,
  deleteSalesItem,
  exportSalesItemsCSV,
  exportSalesItemsPDF,
  importSalesItemsCSV,
} from "@/api/sales/sales.api";

import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";

/* -------------------------------------------------------------------------
   TYPES
------------------------------------------------------------------------- */

interface Sale {
  id: number;
  number: string;
  item: string;

  diamond_pcs: number | string;
  diamond_carat: number | string;
  rate: number | string;
  total_diamond_price: number | string;

  gold: number | string;
  gold_price: number | string;
  diamond_packet?: string | null;

  labour_charge: number | string;
  total_making_cost: number | string;

  selling_price: number | string;

  craftsman_name?: string | null;
  customer_name?: string | null;

  created_at: string;
  updated_at: string;
}

interface Option {
  id: string;
  name: string;
}

/* -------------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------------- */

const formatMoney = (value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  return isNaN(num) ? "—" : num.toFixed(2);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* -------------------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------------------- */

const Sales: React.FC = () => {
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Master data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [craftsmen, setCraftsmen] = useState<Option[]>([]);

  // Refs for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* -----------------------------------------------------------------------
     DATA LOADING
  ----------------------------------------------------------------------- */

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listSalesItems({
        q: searchTerm,
        limit: 20,
        offset: (page - 1) * 20,
      });
      if (!response.ok) throw new Error(response.error || "Failed to load");
      setItems(response.results);
      setHasMore(response.results.length === 20);
    } catch (error) {
      toast.error("Could not load sales items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page]);

  const loadMasters = async () => {
    try {
      const [productsRes, customersRes, craftsmenRes] = await Promise.all([
        fetchProductsAdmin({ limit: 100 }),
        listCustomers({ limit: 100 }),
        listCraftsmen({ limit: 100 }),
      ]);

      setProducts(productsRes.products || []);

      // Safely extract customers – handle both { results } and direct array
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

  /* -----------------------------------------------------------------------
     CALCULATIONS
  ----------------------------------------------------------------------- */

  const calculateTotals = (form: HTMLFormElement) => {
    const diamondCarat = parseFloat(form.diamond_carat?.value) || 0;
    const rate = parseFloat(form.rate?.value) || 0;
    const goldPrice = parseFloat(form.gold_price?.value) || 0;
    const labour = parseFloat(form.labour_charge?.value) || 0;

    const diamondTotal = diamondCarat * rate;
    const makingTotal = goldPrice + labour;
    const selling = diamondTotal + makingTotal;

    if (form.total_diamond_price)
      form.total_diamond_price.value = diamondTotal.toFixed(2);
    if (form.total_making_cost)
      form.total_making_cost.value = makingTotal.toFixed(2);
    if (form.selling_price) form.selling_price.value = selling.toFixed(2);
  };

  /* -----------------------------------------------------------------------
     CREATE
  ----------------------------------------------------------------------- */

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    calculateTotals(form); // ensure latest totals

    const payload: any = {
      number: formData.get("number") as string,
      item: formData.get("item") || formData.get("product_select"),
      diamond_pcs: Number(formData.get("diamond_pcs") || 0),
      diamond_carat: Number(formData.get("diamond_carat") || 0),
      rate: Number(formData.get("rate") || 0),
      gold: Number(formData.get("gold") || 0),
      gold_price: Number(formData.get("gold_price") || 0),
      diamond_packet: formData.get("diamond_packet") || null,
      labour_charge: Number(formData.get("labour_charge") || 0),
      selling_price: Number(formData.get("selling_price") || 0),
    };

    // Customer
    const customerId = formData.get("customer_select");
    const customerManual = formData.get("customer_manual");
    if (customerId) {
      payload.customer_id = customerId;
    } else if (customerManual) {
      payload.customer_name = customerManual;
    }

    // Craftsman
    const craftsmanId = formData.get("craftsman_select");
    const craftsmanManual = formData.get("craftsman_manual");
    if (craftsmanId) {
      payload.craftsman_id = craftsmanId;
    } else if (craftsmanManual) {
      payload.craftsman_name = craftsmanManual;
    }

    try {
      const response = await createSalesItem(payload);
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale created successfully");
      setShowCreateModal(false);
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Creation failed");
    }
  };

  /* -----------------------------------------------------------------------
     UPDATE
  ----------------------------------------------------------------------- */

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSale) return;

    const form = e.currentTarget;
    calculateTotals(form);

    const formData = new FormData(form);

    const payload: any = {
      number: formData.get("number") as string,
      item: formData.get("item") as string,
      diamond_pcs: Number(formData.get("diamond_pcs") || 0),
      diamond_carat: Number(formData.get("diamond_carat") || 0),
      rate: Number(formData.get("rate") || 0),
      gold: Number(formData.get("gold") || 0),
      gold_price: Number(formData.get("gold_price") || 0),
      diamond_packet: formData.get("diamond_packet") || null,
      labour_charge: Number(formData.get("labour_charge") || 0),
      selling_price: Number(formData.get("selling_price") || 0),
    };

    // Customer
    const customerId = formData.get("customer_select");
    const customerManual = formData.get("customer_manual");
    if (customerId) {
      payload.customer_id = customerId;
      delete payload.customer_name;
    } else if (customerManual) {
      payload.customer_name = customerManual;
      delete payload.customer_id;
    }

    // Craftsman
    const craftsmanId = formData.get("craftsman_select");
    const craftsmanManual = formData.get("craftsman_manual");
    if (craftsmanId) {
      payload.craftsman_id = craftsmanId;
      delete payload.craftsman_name;
    } else if (craftsmanManual) {
      payload.craftsman_name = craftsmanManual;
      delete payload.craftsman_id;
    }

    try {
      await updateSalesItem(editingSale.id.toString(), payload);
      toast.success("Sale updated");
      setEditingSale(null);
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  /* -----------------------------------------------------------------------
     DELETE
  ----------------------------------------------------------------------- */

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;
    try {
      await deleteSalesItem(id.toString());
      toast.success("Sale deleted");
      loadSales();
    } catch {
      toast.error("Deletion failed");
    }
  };

  /* -----------------------------------------------------------------------
     EXPORT / IMPORT
  ----------------------------------------------------------------------- */

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    try {
      const blob = await exportSalesItemsCSV();
      downloadBlob(blob, "sales-items.csv");
    } catch {
      toast.error("CSV export failed");
    }
  };

  const exportPDF = async () => {
    try {
      const blob = await exportSalesItemsPDF();
      downloadBlob(blob, "sales-register.pdf");
    } catch (error) {
      console.error(error);
      toast.error("PDF export failed");
    }
  };

  const importCSV = async (file: File) => {
    try {
      await importSalesItemsCSV(file);
      toast.success("CSV imported successfully");
      loadSales();
    } catch {
      toast.error("CSV import failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* -----------------------------------------------------------------------
     RENDER
  ----------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Sales Register</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download size={16} /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FileText size={16} /> PDF
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Upload size={16} /> Import
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])}
            />
          </label>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={16} /> New Sale
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadSales()}
            placeholder="Search by invoice or item..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {(searchTerm || page > 1) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setPage(1);
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Invoice",
                  "Item",
                  "Dia Pcs",
                  "Dia Ct",
                  "Rate",
                  "Dia Amt",
                  "Gold Wt",
                  "Gold Amt",
                  "Packet",
                  "Labour",
                  "Craftsman",
                  "Making",
                  "Selling",
                  "Customer",
                  "Date",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-400">
                    No sales found
                  </td>
                </tr>
              ) : (
                items.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                      {sale.number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.item}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.diamond_pcs}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.diamond_carat}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatMoney(sale.rate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatMoney(sale.total_diamond_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.gold}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatMoney(sale.gold_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.diamond_packet || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatMoney(sale.labour_charge)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.craftsman_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatMoney(sale.total_making_cost)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-semibold text-gray-900">
                      {formatMoney(sale.selling_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {sale.customer_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <button
                        onClick={() => setEditingSale(sale)}
                        className="mr-2 rounded p-1 text-blue-600 transition hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="rounded p-1 text-red-600 transition hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Load more...
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create New Sale" onClose={() => setShowCreateModal(false)}>
          <Form
            onSubmit={handleCreate}
            products={products}
            customers={customers}
            craftsmen={craftsmen}
            initialData={null}
            calculateTotals={calculateTotals}
            isEdit={false}
            onClose={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingSale && (
        <Modal title="Edit Sale" onClose={() => setEditingSale(null)}>
          <Form
            key={editingSale.id}
            onSubmit={handleUpdate}
            products={products}
            customers={customers}
            craftsmen={craftsmen}
            initialData={editingSale}
            calculateTotals={calculateTotals}
            isEdit={true}
            onClose={() => setEditingSale(null)}
          />
        </Modal>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------
   FORM COMPONENT
------------------------------------------------------------------------- */

interface FormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  products: Product[];
  customers: Option[];
  craftsmen: Option[];
  initialData: Sale | null;
  calculateTotals: (form: HTMLFormElement) => void;
  isEdit: boolean;
  onClose: () => void;
}

const Form: React.FC<FormProps> = ({
  onSubmit,
  products,
  customers,
  craftsmen,
  initialData,
  calculateTotals,
  isEdit,
  onClose,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleInputChange = () => {
    if (formRef.current) calculateTotals(formRef.current);
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
        {/* Invoice Number */}
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Invoice Number *
          </label>
          <input
            type="text"
            name="number"
            required
            defaultValue={initialData?.number}
            readOnly={isEdit}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isEdit ? "bg-gray-100" : ""
            }`}
          />
        </div>

        {/* Product selection + manual item */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Product (select)
          </label>
          <select
            name="product_select"
            defaultValue={products.find((p) => p.title === initialData?.item)?.id || ""}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          >
            <option value="">— Select product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Or enter manually
          </label>
          <input
            type="text"
            name="item"
            defaultValue={initialData?.item}
            placeholder="Item name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Diamond details */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Diamond Pcs
          </label>
          <input
            type="number"
            name="diamond_pcs"
            step="1"
            defaultValue={initialData?.diamond_pcs}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Diamond Carat
          </label>
          <input
            type="number"
            name="diamond_carat"
            step="0.01"
            defaultValue={initialData?.diamond_carat}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rate (per carat)
          </label>
          <input
            type="number"
            name="rate"
            step="0.01"
            defaultValue={initialData?.rate}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Calculated diamond total */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Diamond Total
          </label>
          <input
            type="text"
            name="total_diamond_price"
            readOnly
            defaultValue={initialData?.total_diamond_price}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600"
          />
        </div>

        {/* Gold */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Gold Weight
          </label>
          <input
            type="number"
            name="gold"
            step="0.01"
            defaultValue={initialData?.gold}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Gold Amount
          </label>
          <input
            type="number"
            name="gold_price"
            step="0.01"
            defaultValue={initialData?.gold_price}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Diamond packet */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Diamond Packet
          </label>
          <input
            type="text"
            name="diamond_packet"
            defaultValue={initialData?.diamond_packet || ""}
            placeholder="Packet ref"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Labour */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Labour Charge
          </label>
          <input
            type="number"
            name="labour_charge"
            step="0.01"
            defaultValue={initialData?.labour_charge}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Calculated making cost */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Making Cost
          </label>
          <input
            type="text"
            name="total_making_cost"
            readOnly
            defaultValue={initialData?.total_making_cost}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600"
          />
        </div>

        {/* Selling price */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Selling Price *
          </label>
          <input
            type="number"
            name="selling_price"
            step="0.01"
            required
            defaultValue={initialData?.selling_price}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleInputChange}
          />
        </div>

        {/* Customer */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer (select)
            </label>
            <select
              name="customer_select"
              defaultValue={
                customers.find((c) => c.name === initialData?.customer_name)?.id || ""
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Or enter manually
            </label>
            <input
              type="text"
              name="customer_manual"
              defaultValue={
                !customers.find((c) => c.name === initialData?.customer_name)
                  ? initialData?.customer_name || ""
                  : ""
              }
              placeholder="Customer name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Craftsman */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Craftsman (select)
            </label>
            <select
              name="craftsman_select"
              defaultValue={
                craftsmen.find((c) => c.name === initialData?.craftsman_name)?.id || ""
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Select craftsman —</option>
              {craftsmen.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Or enter manually
            </label>
            <input
              type="text"
              name="craftsman_manual"
              defaultValue={
                !craftsmen.find((c) => c.name === initialData?.craftsman_name)
                  ? initialData?.craftsman_name || ""
                  : ""
              }
              placeholder="Craftsman name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Save size={16} /> {isEdit ? "Update Sale" : "Create Sale"}
        </button>
      </div>
    </form>
  );
};

/* -------------------------------------------------------------------------
   MODAL COMPONENT
------------------------------------------------------------------------- */

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/minal_gems_logo.svg" alt="Minal Gems" className="h-8 w-auto" />
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Sales;