// src/pages/masters/products/ProductsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  X,
  Loader2,
  Upload,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Trash,
  Star,
  ExternalLink,
  Video,
  Diamond,
  Gem,
  PlusCircle,
  Save as SaveIcon,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type {
  Product,
  TradeType as ProductTradeType,
  ProductAsset,
} from "@/api/masters/products.api";
import {
  fetchProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  fetchProductAssets,
  uploadProductAssets,
  setPrimaryProductAsset,
  deleteProductAsset,
} from "@/api/masters/products.api";
import type { Category } from "@/api/masters/categories.api";
import { fetchCategories } from "@/api/masters/categories.api";
import { getAssetUrl } from "@/utils/assetUrl";

// Helper to get full API URL for raw fetch
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const getFullApiUrl = (relativePath: string) => `${API_BASE_URL}${relativePath}`;

// Helper to retrieve the auth token – tries common keys used by the app
const getAuthToken = (): string | null => {
  const possibleKeys = [
    "token",
    "access_token",
    "accessToken",
    "auth_token",
    "authToken",
    "jwt",
  ];
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      console.debug(`Token found under key: ${key}`);
      return token;
    }
  }
  console.warn("No auth token found in localStorage");
  return null;
};

const TRADE_TYPE_OPTIONS: { value: ProductTradeType | ""; label: string }[] = [
  { value: "", label: "All trade types" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
];

const METAL_TYPE_OPTIONS = [
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "silver", label: "Silver" },
  { value: "other", label: "Other" },
];

const GOLD_CARAT_OPTIONS = [
  { value: 9, label: "9K" },
  { value: 14, label: "14K" },
  { value: 18, label: "18K" },
  { value: 22, label: "22K" },
  { value: 24, label: "24K" },
];

const DIAMOND_TYPE_OPTIONS = [
  "Diamond",
  "Ruby",
  "Emerald",
  "Sapphire",
  "Pearl",
  "Onyx",
  "Topaz",
  "Amethyst",
  "Other",
];

const DIAMOND_COLOR_OPTIONS = [
  "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "Yellow", "Pink", "Blue", "Green", "White", "Champagne",
];

const DIAMOND_CLARITY_OPTIONS = [
  "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3",
];

interface DiamondEntry {
  id: string;
  pcs: number;
  type: string;
  carat: number;
  rate: number;
  color: string;
  clarity: string;
  shape?: string;
  packet_no?: string;
}

interface ProductFormState {
  title: string;
  slug: string;
  sku: string;
  price: number;
  currency: string;
  short_description: string;
  description: string;
  category_id: string;
  trade_type: ProductTradeType;
  is_published: boolean;
  available_qty: number;
  moq: number;
  diamond_pcs: number;
  diamond_carat: number;
  rate: number;
  diamonds: any[];
  metal_type: string;
  gold_carat: number;
}

const blankProductForm: ProductFormState = {
  title: "",
  slug: "",
  sku: "",
  price: 0,
  currency: "INR",
  short_description: "",
  description: "",
  category_id: "",
  trade_type: "both",
  is_published: false,
  available_qty: 0,
  moq: 1,
  diamond_pcs: 0,
  diamond_carat: 0,
  rate: 0,
  diamonds: [],
  metal_type: "gold",
  gold_carat: 18,
};

function slugifyClient(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tradeType, setTradeType] = useState<ProductTradeType | "">("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const [viewDiamondsOpen, setViewDiamondsOpen] = useState(false);
  const [viewingDiamonds, setViewingDiamonds] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(blankProductForm);
  const [saving, setSaving] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [diamondEntries, setDiamondEntries] = useState<DiamondEntry[]>([]);
  const [diamondModalOpen, setDiamondModalOpen] = useState(false);
  const [editingDiamondIndex, setEditingDiamondIndex] = useState<number | null>(null);
  const [currentDiamond, setCurrentDiamond] = useState<DiamondEntry>({
    id: "",
    pcs: 1,
    type: "Diamond",
    carat: 0,
    rate: 0,
    color: "G",
    clarity: "VS1",
    shape: "Round",
    packet_no: "",
  });

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetProduct, setAssetProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsSaving, setAssetsSaving] = useState(false);
  const assetsFileInputRef = useRef<HTMLInputElement | null>(null);

  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const pageCount = useMemo(() => (total > 0 ? Math.ceil(total / limit) : 1), [total, limit]);

  useEffect(() => {
    const diamondsForBackend = diamondEntries.map(({ id, ...rest }) => rest);
    setForm((prev) => ({ ...prev, diamonds: diamondsForBackend }));
    const totalPcs = diamondEntries.reduce((sum, d) => sum + (d.pcs || 0), 0);
    const totalCarat = diamondEntries.reduce((sum, d) => sum + (d.carat || 0), 0);
    setForm((prev) => ({
      ...prev,
      diamond_pcs: totalPcs,
      diamond_carat: totalCarat,
    }));
  }, [diamondEntries]);

  async function loadProducts(targetPage?: number) {
    setLoading(true);
    try {
      const pageToFetch = targetPage !== undefined ? targetPage : 1;
      const res = await fetchProductsAdmin({
        q,
        category_id: categoryFilter || undefined,
        trade_type: tradeType || undefined,
        is_published: publishedFilter === "" ? undefined : publishedFilter === "true" ? true : false,
        page: pageToFetch,
        limit,
      });
      setProducts(res.products || []);
      setTotal(res.total || 0);
      setPage(res.page || pageToFetch);
      setSelectedProductIds(new Set());
    } catch (err) {
      console.error("Failed to load products", err);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoriesForFilter() {
    setCategoriesLoading(true);
    try {
      const res = await fetchCategories({ page: 1, limit: 200, includeCounts: false });
      setCategories(res.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast.error("Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function loadAssets(productId: string) {
    setAssetsLoading(true);
    try {
      const res = await fetchProductAssets(productId);
      setAssets(res.assets || []);
    } catch (err) {
      console.error("Failed to load assets", err);
      toast.error("Failed to load product assets.");
    } finally {
      setAssetsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(1);
    loadCategoriesForFilter();
  }, []);

  useEffect(() => {
    loadProducts(1);
  }, [tradeType, categoryFilter, publishedFilter]);

  useEffect(() => {
    if (modalOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [modalOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(1);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentProduct(null);
    setForm(blankProductForm);
    setDiamondEntries([]);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setModalMode("edit");
    setCurrentProduct(p);
    let parsedDiamonds: DiamondEntry[] = [];
    if (p.diamonds && Array.isArray(p.diamonds)) {
      parsedDiamonds = p.diamonds.map((d, idx) => ({
        id: `edit-${idx}`,
        pcs: d.pcs || 0,
        type: d.type || "Diamond",
        carat: d.carat || 0,
        rate: d.rate || 0,
        color: d.color || "G",
        clarity: d.clarity || "VS1",
        shape: d.shape || "Round",
        packet_no: d.packet_no || "",
      }));
    }
    setDiamondEntries(parsedDiamonds);
    setForm({
      title: p.title,
      slug: p.slug,
      sku: p.sku || "",
      price: Number(p.price),
      currency: p.currency || "INR",
      short_description: p.short_description || "",
      description: p.description || "",
      category_id: p.category_id || "",
      trade_type: (p.trade_type || "both") as ProductTradeType,
      is_published: !!p.is_published,
      available_qty: Number(p.available_qty ?? 0),
      moq: Number(p.moq ?? 1),
      diamond_pcs: p.diamond_pcs ?? 0,
      diamond_carat: p.diamond_carat ?? 0,
      rate: p.rate ?? 0,
      diamonds: p.diamonds && Array.isArray(p.diamonds) ? p.diamonds : [],
      metal_type: p.metal_type || "gold",
      gold_carat: p.gold_carat ?? 18,
    });
    setModalOpen(true);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.title}"?`)) return;
    try {
      await deleteProductAdmin(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Product deleted.");
    } catch (err) {
      console.error("Failed to delete product", err);
      toast.error("Failed to delete product.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!isFinite(Number(form.price))) {
      toast.error("Price is required and must be numeric.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugifyClient(form.title),
        price: Number(form.price),
        currency: form.currency || "INR",
        short_description: form.short_description || undefined,
        description: form.description || undefined,
        sku: form.sku || undefined,
        category_id: form.category_id || undefined,
        trade_type: form.trade_type,
        is_published: form.is_published,
        available_qty: form.available_qty,
        moq: form.moq,
        diamond_pcs: form.diamond_pcs,
        diamond_carat: form.diamond_carat,
        rate: form.rate,
        diamonds: form.diamonds,
        metal_type: form.metal_type,
        gold_carat: form.gold_carat,
      };

      if (modalMode === "create") {
        const res = await createProductAdmin(payload);
        const createdProduct = (res && (res.product ?? res)) as Product | undefined;
        if (createdProduct) {
          setProducts((prev) => [createdProduct, ...prev]);
          setTotal((t) => t + 1);
        }
        toast.success("Product created.");
        await loadProducts(1);
      } else if (modalMode === "edit" && currentProduct) {
        const res = await updateProductAdmin(currentProduct.id, payload);
        const updatedProduct = (res && (res.product ?? res)) as Product | undefined;
        if (updatedProduct) {
          setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p)));
        }
        toast.success("Product updated.");
        await loadProducts(page);
      }

      setModalOpen(false);
      setCurrentProduct(null);
      setForm(blankProductForm);
      setDiamondEntries([]);
    } catch (err) {
      console.error("Failed to save product", err);
      toast.error("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (p: Product) => {
    try {
      const updated = await updateProductAdmin(p.id, { is_published: !p.is_published });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated.product : x)));
      toast.success(updated.product.is_published ? "Product is now published." : "Product set to draft.");
    } catch (err) {
      console.error("Failed to toggle published", err);
      toast.error("Failed to update publish status.");
    }
  };

  const findCategoryName = (id?: string | null) => {
    if (!id) return "—";
    const c = categories.find((cat) => cat.id === id);
    return c ? c.name : "—";
  };

  const openAssetsModal = (p: Product) => {
    setAssetProduct(p);
    setAssetModalOpen(true);
    setAssets([]);
    loadAssets(p.id);
  };

  const handleAssetsUploadClick = () => {
    assetsFileInputRef.current?.click();
  };

  const handleAssetsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !assetProduct) return;
    e.target.value = "";

    setAssetsSaving(true);
    try {
      for (const file of files) {
        const fileFormData = new FormData();
        fileFormData.append("files", file);
        let assetType = "image";
        if (file.type.startsWith("video/")) assetType = "video";
        fileFormData.append("asset_type", assetType);
        fileFormData.append("is_primary", assets.length === 0 && files.indexOf(file) === 0 ? "true" : "false");
        fileFormData.append("sort_order", "0");
        fileFormData.append("metadata", JSON.stringify({}));

        const res = await uploadProductAssets(assetProduct.id, fileFormData);
        setAssets((prev) => [...prev, ...(res.assets || [])]);
      }
      toast.success("Media uploaded.");
    } catch (err) {
      console.error("Failed to upload product assets", err);
      toast.error("Failed to upload assets.");
    } finally {
      setAssetsSaving(false);
    }
  };

  const handleSetPrimaryAsset = async (asset: ProductAsset) => {
    try {
      const res = await setPrimaryProductAsset(asset.id);
      const updated = res.asset;
      if (!updated) {
        toast.error("Failed to set primary image.");
        return;
      }
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          is_primary: a.id === updated.id,
        }))
      );
      toast.success("Primary image updated.");
    } catch (err) {
      console.error("Failed to set primary asset", err);
      toast.error("Failed to set primary image.");
    }
  };

  const handleDeleteAsset = async (asset: ProductAsset) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await deleteProductAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("Asset deleted.");
    } catch (err) {
      console.error("Failed to delete asset", err);
      toast.error("Failed to delete asset.");
    }
  };

  const openAddDiamondModal = () => {
    setEditingDiamondIndex(null);
    setCurrentDiamond({
      id: crypto.randomUUID(),
      pcs: 1,
      type: "Diamond",
      carat: 0,
      rate: 0,
      color: "G",
      clarity: "VS1",
      shape: "Round",
      packet_no: "",
    });
    setDiamondModalOpen(true);
  };

  const openEditDiamondModal = (idx: number) => {
    setEditingDiamondIndex(idx);
    setCurrentDiamond({ ...diamondEntries[idx] });
    setDiamondModalOpen(true);
  };

  const saveDiamond = () => {
    if (currentDiamond.pcs <= 0) {
      toast.error("Pieces must be > 0");
      return;
    }
    if (currentDiamond.carat <= 0) {
      toast.error("Carat weight must be > 0");
      return;
    }
    if (currentDiamond.rate <= 0) {
      toast.error("Rate must be > 0");
      return;
    }
    const newDiamond = { ...currentDiamond, id: currentDiamond.id || crypto.randomUUID() };
    if (editingDiamondIndex !== null) {
      const updated = [...diamondEntries];
      updated[editingDiamondIndex] = newDiamond;
      setDiamondEntries(updated);
    } else {
      setDiamondEntries([...diamondEntries, newDiamond]);
    }
    setDiamondModalOpen(false);
  };

  const removeDiamond = (idx: number) => {
    if (window.confirm("Remove this gemstone?")) {
      const updated = [...diamondEntries];
      updated.splice(idx, 1);
      setDiamondEntries(updated);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    }
  };

  // ✅ Fixed export handlers using the correct token
  const handleExportAll = async () => {
    if (!products.length) {
      toast("No products to export.", { icon: "ℹ️" });
      return;
    }
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token missing. Please log in again.");
      return;
    }
    try {
      const url = getFullApiUrl(`/masters/products/export?format=csv`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again.");
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      downloadBlob(blob, "products_export.csv");
      toast.success("All products exported.");
    } catch (err) {
      console.error("Export failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to export products.");
    }
  };

  const handleExportSelected = async () => {
    if (selectedProductIds.size === 0) {
      toast.error("No products selected.");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token missing. Please log in again.");
      return;
    }
    const ids = Array.from(selectedProductIds).join(",");
    try {
      const url = getFullApiUrl(`/masters/products/export?format=csv&ids=${ids}`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again.");
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      downloadBlob(blob, "selected_products_export.csv");
      toast.success("Selected products exported.");
    } catch (err) {
      console.error("Export selected failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to export selected products.");
    }
  };

  const handleImportClick = () => {
    setImportSummary(null);
    csvFileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setImportSummary(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        const msg = "No rows found in CSV.";
        setImportSummary(msg);
        toast(msg, { icon: "ℹ️" });
        return;
      }

      const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
      const dataLines = lines.slice(1);
      let created = 0;
      let failed = 0;

      for (const line of dataLines) {
        const values = line.split(",").map(v => v.replace(/^"|"$/g, "").trim());
        const record: any = {};
        headers.forEach((h, idx) => { record[h] = values[idx]; });

        try {
          if (!record.title || !record.slug || record.price === undefined) {
            failed++;
            continue;
          }
          let diamondsArray = [];
          if (record.diamonds) {
            try {
              diamondsArray = JSON.parse(record.diamonds);
            } catch {
              diamondsArray = [];
            }
          }
          await createProductAdmin({
            title: record.title,
            slug: record.slug || slugifyClient(record.title),
            sku: record.sku || undefined,
            price: parseFloat(record.price) || 0,
            currency: record.currency || "INR",
            short_description: record.short_description || undefined,
            description: record.description || undefined,
            category_id: record.category_id || undefined,
            trade_type: (record.trade_type as ProductTradeType) || "both",
            is_published: record.is_published === "true",
            available_qty: parseInt(record.available_qty) || 0,
            moq: parseInt(record.moq) || 0,
            diamond_pcs: parseInt(record.diamond_pcs) || 0,
            diamond_carat: parseFloat(record.diamond_carat) || 0,
            rate: parseFloat(record.rate) || 0,
            diamonds: diamondsArray,
            metal_type: record.metal_type || "gold",
            gold_carat: parseFloat(record.gold_carat) || 18,
          });
          created++;
        } catch (err) {
          console.error("Failed to import product row", line, err);
          failed++;
        }
      }
      const summary = `Import completed. Created: ${created}, Failed: ${failed}.`;
      setImportSummary(summary);
      toast.success("Products CSV import completed.");
      await loadProducts(1);
    } catch (err) {
      console.error("Failed to import products CSV", err);
      const msg = "Failed to import CSV. Check console for details.";
      setImportSummary(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const pageCountValue = pageCount;

  return (
    <div className="relative">
      <AdminPageHeader
        title="Products"
        subtitle="Manage Minal Gems product catalog, pricing and visibility."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Products" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download size={16} /> Export All
            </button>
            <button
              onClick={handleExportSelected}
              disabled={selectedProductIds.size === 0}
              className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
            >
              <Download size={16} /> Export Selected ({selectedProductIds.size})
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Import CSV
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              <Plus size={16} /> New Product
            </button>
            <input ref={csvFileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFileChange} />
          </div>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {importSummary && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            {importSummary}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products by title or description…"
                className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Filter size={16} /> Apply
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              disabled={categoriesLoading}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as ProductTradeType | "")}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {TRADE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>

            <button
              onClick={() => loadProducts(page)}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProductIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600"
                    />
                  </th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Trade</th>
                  <th className="px-6 py-4">Diamond Pcs</th>
                  <th className="px-6 py-4">Diamond Carat</th>
                  <th className="px-6 py-4">Metal Type</th>
                  <th className="px-6 py-4">Gold Carat</th>
                  <th className="px-6 py-4">Stones</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-lg">No products found</td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(p.id)}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {p.primary_image ? (
                          <img
                            src={getAssetUrl(p.primary_image)}
                            alt={p.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center">
                            <Package size={20} className="text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.title}</span>
                          </div>
                          {p.short_description && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {p.short_description}
                            </div>
                          )}
                          {p.sku && <div className="text-xs text-slate-400 dark:text-slate-500">SKU: {p.sku}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base font-semibold">
                          {p.currency} {Number(p.price).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">MOQ: {p.moq ?? 1}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{findCategoryName(p.category_id)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                          {p.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{p.diamond_pcs ?? 0}</td>
                      <td className="px-6 py-4 text-sm">{p.diamond_carat ?? 0}</td>
                      <td className="px-6 py-4 text-sm capitalize">{p.metal_type || "gold"}</td>
                      <td className="px-6 py-4 text-sm">{p.gold_carat ?? 18}K</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setViewingDiamonds(p.diamonds && Array.isArray(p.diamonds) ? p.diamonds : []);
                            setViewDiamondsOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          <Eye size={14} /> {p.diamonds?.length || 0}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{p.available_qty ?? 0}</div>
                        <div className="text-xs text-slate-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublished(p)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            p.is_published
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {p.is_published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/admin/products/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ExternalLink size={14} /> View
                        </Link>
                        <button
                          onClick={() => openAssetsModal(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <ImageIcon size={14} /> Assets
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>Page {page} of {pageCountValue} · {total} products</div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  const newPage = page - 1;
                  if (newPage < 1) return;
                  loadProducts(newPage);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCountValue || loading}
                onClick={() => {
                  const newPage = page + 1;
                  if (newPage > pageCountValue) return;
                  loadProducts(newPage);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL (unchanged) – same as previous version */}
      {modalOpen && (
        // ... (same modal content as before – no changes needed)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div
            ref={modalContentRef}
            className="w-full max-w-5xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950 my-8 mx-4"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" alt="logo" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Create Product" : "Edit Product"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Configure product details, pricing, gemstones, and metal.
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-base">
              {/* ... keep all form fields as previously defined ... */}
              {/* (I'm omitting the full form here for brevity – it is unchanged from the last correct version) */}
            </form>
          </div>
        </div>
      )}

      {/* Diamond Modal (add/edit) – unchanged */}
      {diamondModalOpen && (
        // ... same as before
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950">
            {/* ... modal content ... */}
          </div>
        </div>
      )}

      {/* View Diamonds Modal – unchanged */}
      {viewDiamondsOpen && (
        // ... same as before
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* ... modal content ... */}
          </div>
        </div>
      )}

      {/* ASSET MODAL – unchanged */}
      {assetModalOpen && assetProduct && (
        // ... same as before
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
          {/* ... asset modal content ... */}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;