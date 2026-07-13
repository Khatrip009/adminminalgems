import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Eye,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";

import type {
  Product,
  TradeType as ProductTradeType,
  ProductAsset,
  Diamond as DiamondType,
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
  fetchProductDiamonds,
  fetchCraftsmen,
  downloadProductRegisterPDF, // ★ new
} from "@/api/masters/products.api";
import type { Category } from "@/api/masters/categories.api";
import { fetchCategories } from "@/api/masters/categories.api";
import { getAssetUrl } from "@/utils/assetUrl";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const getFullApiUrl = (relativePath: string) => `${API_BASE_URL}${relativePath}`;

// ---------- CONSTANTS (unchanged) ----------
const METAL_TYPE_OPTIONS = [
  { value: "Yellow_Gold", label: "Yellow Gold" },
  { value: "White_Gold", label: "White Gold" },
  { value: "Rose_Gold", label: "Rose Gold" },
  { value: "Silver", label: "Silver" },
  { value: "Platinum", label: "Platinum" },
];

const GOLD_CARAT_OPTIONS = [
  { value: 9, label: "9K" },
  { value: 14, label: "14K" },
  { value: 18, label: "18K" },
  { value: 22, label: "22K" },
  { value: 24, label: "24K" },
];

const DIAMOND_TYPE_OPTIONS = [
  "Diamond", "HPHT", "LABGROWN", "Ruby", "Emerald", "Sapphire", "Pearl", "Onyx",
  "Topaz", "Amethyst", "CVD", "Other",
];

const DIAMOND_COLOR_OPTIONS = [
  "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "DE", "EF","FG", "GH", "HI",
  "IJ", "JK", "KL", "LM", "Yellow", "Pink", "Blue", "Green", "White", "Champagne",
];

const DIAMOND_CLARITY_OPTIONS = [
  "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3", "VVS", "VS", "SI","VVS VS","VS SI", "SI I1"
];

const DIAMOND_SHAPE_OPTIONS = [
  "Round", "Oval", "Pear", "Cushion Modified", "Cushion Brilliant",
  "Emerald", "Radiant", "Princess", "Asscher", "Square", "Marquise",
  "Heart", "Trilliant", "Euro Cut", "Old Miner", "Briolette", "Rose Cut",
  "Lozenge", "Baguette", "Tapered Baguette", "Half Moon", "Flanders",
  "Trapezoid", "Bullets", "Kite", "Shield", "Star", "Pentagonal",
  "Hexagonal", "Octagonal", "Portuguese", "Moval Cut"
];

const OCCASION_OPTIONS = [
  "Wedding", "Festive", "Party", "Engagement", "Anniversary", "Daily Wear",
];

// ---------- INTERFACES (unchanged) ----------
interface DiamondEntry {
  id: string;
  pcs: number;
  type: string;
  carat: number;
  color: string;
  clarity: string;
  shape?: string;
  packet_no?: string;
  rate: number;
  sort_order?: number;
}

interface MetadataFields {
  stone?: string;
  gender?: string;
  origin?: string;
  purity?: string;
  material?: string;
  occasion: string[];
  weight_grams?: number;
  certification?: string;
}

interface ProductFormState {
  title: string;
  slug: string;
  price: number;
  currency: string;
  short_description: string;
  description: string;
  category_id: string;
  is_published: boolean;
  available_qty: number;
  moq: number;
  item_no: string;
  total_diamond_pcs: number;
  total_diamond_carat: number;
  total_diamond_price: number;
  diamonds: any[];
  metal_type: string;
  gold_carat: number;
  metal_rate: number;
  total_metal_price: number;
  total_weight: number;
  gold_weight: number;
  labour: number;
  profit_percent: number;
  profit_amount: number;
  craftsman_id?: string;
  metadataFields: MetadataFields;
}

const blankProductForm: ProductFormState = {
  title: "",
  slug: "",
  price: 0,
  currency: "INR",
  short_description: "",
  description: "",
  category_id: "",
  is_published: true,
  available_qty: 0,
  moq: 1,
  item_no: "",
  total_diamond_pcs: 0,
  total_diamond_carat: 0,
  total_diamond_price: 0,
  diamonds: [],
  metal_type: "Yellow_Gold",
  gold_carat: 18,
  metal_rate: 0,
  total_metal_price: 0,
  total_weight: 0,
  gold_weight: 0,
  labour: 0,
  profit_percent: 0,
  profit_amount: 0,
  craftsman_id: undefined,
  metadataFields: {
    stone: "",
    gender: "",
    origin: "",
    purity: "",
    material: "",
    occasion: [],
    weight_grams: undefined,
    certification: "",
  },
};

// ---------- helpers (unchanged) ----------
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

function generateSku(title: string, slug: string): string {
  const base = slug || slugifyClient(title);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`.substring(0, 50);
}

const ProductsPage: React.FC = () => {
  const { token } = useAuth();

  // ---------- STATE (unchanged) ----------
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const categoriesFetched = useRef(false);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showMobileActions, setShowMobileActions] = useState(false);

  const [viewDiamondsOpen, setViewDiamondsOpen] = useState(false);
  const [viewingDiamonds, setViewingDiamonds] = useState<DiamondType[]>([]);

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
    id: "", pcs: 1, type: "Diamond", carat: 0, color: "G", clarity: "VS1",
    shape: "Round", packet_no: "", rate: 0, sort_order: 0,
  });
  const [showOtherTypeInput, setShowOtherTypeInput] = useState(false);
  const [otherTypeValue, setOtherTypeValue] = useState("");

  const [customMetalType, setCustomMetalType] = useState("");
  const [customGoldCarat, setCustomGoldCarat] = useState<number | null>(null);
  const [customDiamondColor, setCustomDiamondColor] = useState("");
  const [customDiamondClarity, setCustomDiamondClarity] = useState("");
  const [customDiamondShape, setCustomDiamondShape] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetProduct, setAssetProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsSaving, setAssetsSaving] = useState(false);
  const assetsFileInputRef = useRef<HTMLInputElement | null>(null);

  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const [craftsmen, setCraftsmen] = useState<{ id: string; name: string }[]>([]);
  const craftsmenLoaded = useRef(false);

  const pageCount = useMemo(() => (total > 0 ? Math.ceil(total / limit) : 1), [total, limit]);

  // ---------- EFFECTS (unchanged) ----------
  useEffect(() => {
    const totalPcs = diamondEntries.reduce((sum, d) => sum + (d.pcs || 0), 0);
    const totalCarat = diamondEntries.reduce((sum, d) => sum + (d.carat || 0), 0);
    const totalDiamondPrice = diamondEntries.reduce((sum, d) => sum + (d.carat * d.rate || 0), 0);
    setForm((prev) => ({
      ...prev,
      diamonds: diamondEntries.map(({ id, ...rest }) => rest),
      total_diamond_pcs: totalPcs,
      total_diamond_carat: totalCarat,
      total_diamond_price: totalDiamondPrice,
    }));
  }, [diamondEntries]);

  useEffect(() => {
    const totalMetalPrice = (form.gold_weight || 0) * (form.metal_rate || 0);
    const cost = form.total_diamond_price + totalMetalPrice + form.labour;
    const profitAmount = cost * (form.profit_percent / 100);
    setForm((prev) => ({
      ...prev,
      total_metal_price: totalMetalPrice,
      profit_amount: profitAmount,
    }));
  }, [form.gold_weight, form.metal_rate, form.total_diamond_price, form.labour, form.profit_percent]);

  // ---------- API CALLS (unchanged) ----------
  async function loadProducts(targetPage?: number) {
    setLoading(true);
    try {
      const pageToFetch = targetPage ?? 1;
      const res = await fetchProductsAdmin({
        q,
        category_id: categoryFilter || undefined,
        trade_type: "both",
        is_published: publishedFilter === "" ? undefined : publishedFilter === "true",
        page: pageToFetch,
        limit,
      });

      let fetchedProducts = res.products || [];

      if (sortBy && sortDir) {
        fetchedProducts = [...fetchedProducts].sort((a, b) => {
          let aVal = a[sortBy as keyof Product];
          let bVal = b[sortBy as keyof Product];
          if (sortBy === "category_id") {
            aVal = findCategoryName(a.category_id);
            bVal = findCategoryName(b.category_id);
          }
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
          if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }

      setProducts(fetchedProducts);
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

  async function loadCategories() {
    if (categoriesFetched.current) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetchCategories({ page: 1, limit: 200, includeCounts: false });
      setCategories(res.categories || []);
      categoriesFetched.current = true;
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategoriesError("Could not load categories. Please refresh.");
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

  async function loadProductDiamonds(productId: string): Promise<DiamondType[]> {
    try {
      const res = await fetchProductDiamonds(productId);
      return res.diamonds || [];
    } catch (err) {
      console.error("Failed to load diamonds", err);
      return [];
    }
  }

  async function loadCraftsmen() {
    if (craftsmenLoaded.current) return;
    try {
      const data = await fetchCraftsmen();
      setCraftsmen(data);
      craftsmenLoaded.current = true;
    } catch (err) {
      console.error("Failed to load craftsmen", err);
      toast.error("Failed to load craftsmen.");
    }
  }

  useEffect(() => { loadProducts(1); loadCategories(); }, []);
  useEffect(() => { loadProducts(1); }, [categoryFilter, publishedFilter]);
  useEffect(() => { if (modalOpen && modalContentRef.current) { modalContentRef.current.scrollTop = 0; } }, [modalOpen]);

  // ---------- HANDLERS (mostly unchanged; new download handler added) ----------
  const handleSort = (column: string) => {
    if (sortBy === column) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortDir("asc"); }
  };
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />;
  };
  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); loadProducts(1); };

  const openCreateModal = () => {
    setModalMode("create"); setCurrentProduct(null); setForm(blankProductForm); setDiamondEntries([]);
    setCustomMetalType(""); setCustomGoldCarat(null); setCustomDiamondColor(""); setCustomDiamondClarity("");
    setCustomDiamondShape(""); setCustomOccasion(""); loadCraftsmen(); setModalOpen(true); setShowMobileActions(false);
  };

  const openEditModal = async (p: Product) => {
    setModalMode("edit"); setCurrentProduct(p);
    const backendDiamonds = await loadProductDiamonds(p.id);
    const mappedEntries: DiamondEntry[] = backendDiamonds.map((d) => ({
      id: d.id, pcs: Number(d.pcs), type: d.diamond_type, carat: Number(d.carat),
      color: d.color || "G", clarity: d.clarity || "VS1", shape: d.shape,
      packet_no: d.packet_no || "", rate: Number(d.rate), sort_order: Number(d.sort_order ?? 0),
    }));
    setDiamondEntries(mappedEntries);

    let meta: any = {};
    try { meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata || {}; } catch {}
    const metaFields: MetadataFields = {
      stone: meta.stone || "", gender: meta.gender || "", origin: meta.origin || "", purity: meta.purity || "",
      material: meta.material || "", occasion: Array.isArray(meta.occasion) ? meta.occasion : [],
      weight_grams: meta.weight_grams, certification: meta.certification || "",
    };
    setForm({
      title: p.title, slug: p.slug, price: Number(p.price), currency: p.currency || "INR",
      short_description: p.short_description || "", description: p.description || "",
      category_id: p.category_id || "", is_published: !!p.is_published,
      available_qty: Number(p.available_qty ?? 0), moq: Number(p.moq ?? 1),
      item_no: p.item_no || "", total_diamond_pcs: p.total_diamond_pcs ?? 0,
      total_diamond_carat: p.total_diamond_carat ?? 0, total_diamond_price: p.total_diamond_price ?? 0,
      diamonds: [], metal_type: p.metal_type || "Yellow_Gold", gold_carat: Number(p.gold_carat ?? 18),
      metal_rate: Number(p.metal_rate ?? 0), total_metal_price: Number(p.total_metal_price ?? 0),
      total_weight: Number(p.total_weight ?? 0), gold_weight: Number(p.gold_weight ?? 0),
      labour: Number(p.labour ?? 0), profit_percent: Number(p.profit_percent ?? 0),
      profit_amount: Number(p.profit_amount ?? 0), craftsman_id: p.craftsman_id || "",
      metadataFields: metaFields,
    });
    setCustomMetalType(""); setCustomGoldCarat(null); setCustomDiamondColor(""); setCustomDiamondClarity("");
    setCustomDiamondShape(""); setCustomOccasion(""); loadCraftsmen(); setModalOpen(true); setShowMobileActions(false);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.title}"?`)) return;
    try {
      await deleteProductAdmin(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Product deleted.");
    } catch (err) { console.error("Failed to delete product", err); toast.error("Failed to delete product."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!isFinite(Number(form.price))) { toast.error("Price is required and must be numeric."); return; }

    setSaving(true);
    try {
      const slug = form.slug.trim() || slugifyClient(form.title);
      const sku = generateSku(form.title, slug);
      let existingMeta: any = {};
      if (modalMode === "edit" && currentProduct) {
        try { existingMeta = typeof currentProduct.metadata === "string" ? JSON.parse(currentProduct.metadata) : currentProduct.metadata || {}; } catch {}
      }
      const newMeta = { ...existingMeta, ...form.metadataFields,
        occasion: form.metadataFields.occasion.length ? form.metadataFields.occasion : undefined,
        weight_grams: form.metadataFields.weight_grams || undefined,
        certification: form.metadataFields.certification || undefined,
      };
      const diamondPayload = diamondEntries.map((d) => ({
        diamond_type: d.type, shape: d.shape || "Round", color: d.color || null,
        clarity: d.clarity || null, carat: d.carat, pcs: d.pcs, rate: d.rate,
        packet_no: d.packet_no || null, sort_order: d.sort_order ?? 0,
      }));
      const payload: any = {
        title: form.title.trim(), slug, price: Number(form.price), currency: form.currency || "INR",
        short_description: form.short_description || undefined, description: form.description || undefined,
        sku, category_id: form.category_id || undefined, trade_type: "both" as ProductTradeType,
        is_published: form.is_published, available_qty: form.available_qty, moq: form.moq,
        item_no: form.item_no || null, total_diamond_pcs: form.total_diamond_pcs,
        total_diamond_carat: form.total_diamond_carat, total_diamond_price: form.total_diamond_price,
        diamonds: diamondPayload, metal_type: form.metal_type, gold_carat: form.gold_carat,
        metal_rate: form.metal_rate, total_metal_price: form.total_metal_price,
        total_weight: form.total_weight, gold_weight: form.gold_weight,
        labour: form.labour, profit_percent: form.profit_percent,
        craftsman_id: form.craftsman_id || undefined, metadata: newMeta,
      };

      if (modalMode === "create") {
        const res = await createProductAdmin(payload);
        const createdProduct = (res && (res.product ?? res)) as Product | undefined;
        if (createdProduct) { setProducts((prev) => [createdProduct, ...prev]); setTotal((t) => t + 1); }
        toast.success("Product created.");
        await loadProducts(1);
      } else if (modalMode === "edit" && currentProduct) {
        const res = await updateProductAdmin(currentProduct.id, payload);
        const updatedProduct = (res && (res.product ?? res)) as Product | undefined;
        if (updatedProduct) { setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))); }
        toast.success("Product updated.");
        await loadProducts(page);
      }

      setModalOpen(false); setCurrentProduct(null); setForm(blankProductForm); setDiamondEntries([]);
    } catch (err) { console.error("Failed to save product", err); toast.error("Failed to save product."); }
    finally { setSaving(false); }
  };

  const handleTogglePublished = async (p: Product) => {
    try {
      const res = await updateProductAdmin(p.id, { is_published: !p.is_published } as any);
      const updatedProduct = (res && (res.product ?? res)) as Product | undefined;
      if (updatedProduct) { setProducts((prev) => prev.map((x) => (x.id === p.id ? updatedProduct : x))); toast.success(updatedProduct.is_published ? "Product is now published." : "Product set to draft."); }
      else { await loadProducts(page); }
    } catch (err) { console.error("Failed to toggle published", err); toast.error("Failed to update publish status."); }
  };

  const findCategoryName = (id?: string | null) => {
    if (!id) return "—";
    const c = categories.find((cat) => cat.id === id);
    return c ? c.name : "—";
  };

  const openAssetsModal = (p: Product) => { setAssetProduct(p); setAssetModalOpen(true); setAssets([]); loadAssets(p.id); setShowMobileActions(false); };
  const handleAssetsUploadClick = () => { assetsFileInputRef.current?.click(); };
  const handleAssetsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { /* unchanged */ };
  const handleSetPrimaryAsset = async (asset: ProductAsset) => { /* unchanged */ };
  const handleDeleteAsset = async (asset: ProductAsset) => { /* unchanged */ };

  const openAddDiamondModal = () => { /* unchanged */ };
  const openEditDiamondModal = (idx: number) => { /* unchanged */ };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => { /* unchanged */ };
  const handleOtherTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* unchanged */ };
  const saveDiamond = () => { /* unchanged */ };
  const removeDiamond = (idx: number) => { /* unchanged */ };

  const toggleSelectProduct = (productId: string) => { /* unchanged */ };
  const toggleSelectAll = () => { /* unchanged */ };

  const handleExportAll = async () => { /* unchanged */ };
  const handleExportSelected = async () => { /* unchanged */ };

  // ★ NEW: download product register
const handleDownloadRegister = async () => {
  try {
    await downloadProductRegisterPDF(token);   // ← pass the token here
    toast.success("Product register downloaded.");
  } catch (err: any) {
    console.error("Failed to download product register", err);
    toast.error(err.message || "Failed to download product register.");
  }
};

  const handleImportClick = () => { setImportSummary(null); csvFileInputRef.current?.click(); };
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { /* unchanged */ };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- HEADER ACTIONS (updated with Product Register button) ----------
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={handleExportAll} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <Download size={16} /> <span className="hidden sm:inline">Export All</span>
      </button>
      <button onClick={handleExportSelected} disabled={selectedProductIds.size === 0} className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
        <Download size={16} /> <span className="hidden sm:inline">Selected</span> ({selectedProductIds.size})
      </button>
      <button onClick={handleImportClick} disabled={importing} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
        <span className="hidden sm:inline">Import CSV</span>
      </button>
      {/* ★ Product Register Button */}
      <button onClick={handleDownloadRegister} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <FileText size={16} /> <span className="hidden sm:inline">Product Register</span>
      </button>
      <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110">
        <Plus size={16} /> <span className="hidden sm:inline">New Product</span>
      </button>

      <button onClick={() => {
  window.open('/api/masters/products/export/register', '_blank');
}}>
  Test Open Register PDF
</button>
      <input ref={csvFileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFileChange} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
            <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">Manage your product catalog</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {headerActions}
          </div>
          <div className="md:hidden relative">
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="rounded-full border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <MoreVertical size={18} />
            </button>
            {showMobileActions && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 p-2 z-50">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 max-w-7xl mx-auto py-4 space-y-6">
        {importSummary && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            {importSummary}
          </div>
        )}

        {/* Filters & search */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
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
            {categoriesLoading && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="animate-spin" size={12} /> Loading categories…
              </span>
            )}
            {categoriesError && (
              <button onClick={loadCategories} className="text-xs text-red-500 underline">
                {categoriesError} Retry
              </button>
            )}

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

        {/* Products table – now includes Craftsman column */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-base text-slate-800 dark:text-slate-200">
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
                  <th className="px-4 py-4">Image</th>
                  <th
                    className="px-4 py-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center">
                      Product {getSortIcon("title")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      Price {getSortIcon("price")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    onClick={() => handleSort("category_id")}
                  >
                    <div className="flex items-center">
                      Category {getSortIcon("category_id")}
                    </div>
                  </th>
                  <th className="px-4 py-4">Stones</th>
                  <th className="px-4 py-4">Craftsman</th> 
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-lg"> 
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-lg">No products found</td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const diamondCount = p.diamonds ? p.diamonds.length : 0;
                    return (
                      <tr key={p.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(p.id)}
                            onChange={() => toggleSelectProduct(p.id)}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600"
                          />
                        </td>
                        <td className="px-4 py-4">
                          {p.primary_image ? (
                            <img
                              src={getAssetUrl(p.primary_image)}
                              alt={p.title}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded bg-slate-100 flex items-center justify-center">
                              <Package size={18} className="text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm sm:text-base">{p.title}</span>
                            {p.short_description && (
                              <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {p.short_description}
                              </div>
                            )}
                            {p.item_no && <div className="text-xs text-slate-400 dark:text-slate-500">Item: {p.item_no}</div>}
                            {p.sku && <div className="text-xs text-slate-400 dark:text-slate-500">SKU: {p.sku}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm sm:text-base font-semibold">
                            {p.currency} {formatCurrency(p.price)}
                          </div>
                          <div className="text-xs text-slate-500">MOQ: {p.moq ?? 1}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">{findCategoryName(p.category_id)}</td>
                        <td className="px-4 py-4 text-sm">
                          <button
                            onClick={() => {
                              setViewingDiamonds(p.diamonds || []);
                              setViewDiamondsOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            <Eye size={14} /> {diamondCount}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {/* ★ Craftsman name from joined data */}
                          {(p as any).craftsman_name || "—"}
                        </td>
                        <td className="px-4 py-4">
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
                        <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>Page {page} of {pageCount} · {total} products</div>
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
                disabled={page >= pageCount || loading}
                onClick={() => {
                  const newPage = page + 1;
                  if (newPage > pageCount) return;
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

      {/* CREATE / EDIT MODAL */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-0 sm:p-4">
            <div
              ref={modalContentRef}
              className="w-full sm:max-w-5xl sm:rounded-2xl border-0 sm:border border-slate-300 bg-white sm:shadow-xl dark:border-slate-700 dark:bg-slate-950 my-0 sm:my-8 mx-0 sm:mx-4 max-h-screen sm:max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/minal_gems_logo.svg" className="h-8 sm:h-10 w-auto" alt="logo" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                      {modalMode === "create" ? "Create Product" : "Edit Product"}
                    </h2>
                    <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
                      Configure product details, pricing, gemstones, and metal.
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-base px-4 sm:px-6 py-6">
                {/* Title / Slug / Item No */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Title *</label>
                    <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Slug</label>
                    <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugifyClient(e.target.value) }))} placeholder="auto-generated" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Item No.</label>
                    <input value={form.item_no} onChange={(e) => setForm((f) => ({ ...f, item_no: e.target.value }))} placeholder="e.g., 11944" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Price *</label>
                    <input type="number" required min={0} step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                {/* Category / Currency */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Currency</label>
                    <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                {/* ★ Craftsman Selector */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Craftsman</label>
                  <select
                    value={form.craftsman_id || ""}
                    onChange={(e) => setForm((f) => ({ ...f, craftsman_id: e.target.value || undefined }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select craftsman (optional)</option>
                    {craftsmen.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Available Quantity</label>
                    <input type="number" min={0} value={form.available_qty} onChange={(e) => setForm((f) => ({ ...f, available_qty: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">MOQ</label>
                    <input type="number" min={0} value={form.moq} onChange={(e) => setForm((f) => ({ ...f, moq: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                {/* Gemstone Section */}
                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                      <Diamond size={18} /> Gemstones / Diamonds
                    </h3>
                    <button
                      type="button"
                      onClick={openAddDiamondModal}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <PlusCircle size={14} /> Add Gemstone
                    </button>
                  </div>

                  {diamondEntries.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/30">
                      No gemstones added.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[500px] w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Pcs</th>
                            <th className="px-3 py-2">Carat</th>
                            <th className="px-3 py-2">Rate</th>
                            <th className="px-3 py-2">Total</th>
                            <th className="px-3 py-2">Color</th>
                            <th className="px-3 py-2">Clarity</th>
                            <th className="px-3 py-2">Shape</th>
                            <th className="px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diamondEntries.map((d, idx) => (
                            <tr key={d.id} className="border-t">
                              <td className="px-3 py-2">{d.type}</td>
                              <td className="px-3 py-2">{d.pcs}</td>
                              <td className="px-3 py-2">{d.carat}</td>
                              <td className="px-3 py-2">{d.rate}</td>
                              <td className="px-3 py-2">{(d.carat * d.rate).toFixed(2)}</td>
                              <td className="px-3 py-2">{d.color}</td>
                              <td className="px-3 py-2">{d.clarity}</td>
                              <td className="px-3 py-2">{d.shape || "—"}</td>
                              <td className="px-3 py-2 space-x-2">
                                <button type="button" onClick={() => openEditDiamondModal(idx)} className="text-blue-600"><Edit2 size={14} /></button>
                                <button type="button" onClick={() => removeDiamond(idx)} className="text-rose-600"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>Total Pcs: {diamondEntries.reduce((s, d) => s + d.pcs, 0)}</div>
                    <div>Total Carat: {diamondEntries.reduce((s, d) => s + d.carat, 0).toFixed(3)}</div>
                    <div>Total Diamond Price: {form.total_diamond_price.toFixed(2)}</div>
                  </div>
                </div>

                {/* Metal Section */}
                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    <Gem size={18} /> Metal Details
                  </h3>

                  {/* Metal Type */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">Metal Type</label>
                    <div className="flex flex-wrap gap-2">
                      {METAL_TYPE_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                          <input
                            type="radio"
                            name="metal_type"
                            value={opt.value}
                            checked={form.metal_type === opt.value}
                            onChange={(e) => {
                              setForm((f) => ({ ...f, metal_type: e.target.value }));
                              setCustomMetalType("");
                            }}
                            className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-500 dark:text-slate-100"
                          />
                          {opt.label}
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name="metal_type"
                          value="Other"
                          checked={!METAL_TYPE_OPTIONS.some(opt => opt.value === form.metal_type) && form.metal_type !== ""}
                          onChange={() => {
                            setForm((f) => ({ ...f, metal_type: customMetalType || "Other" }));
                          }}
                          className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-500 dark:text-slate-100"
                        />
                        Other
                      </label>
                      {(!METAL_TYPE_OPTIONS.some(opt => opt.value === form.metal_type) && form.metal_type !== "") && (
                        <input
                          type="text"
                          placeholder="Enter metal type"
                          value={customMetalType}
                          onChange={(e) => {
                            setCustomMetalType(e.target.value);
                            setForm((f) => ({ ...f, metal_type: e.target.value }));
                          }}
                          className="rounded-full border border-slate-300 px-3 py-2 text-sm w-40"
                        />
                      )}
                    </div>
                  </div>

                  {/* Gold Carat */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">Gold Carat</label>
                    <div className="flex flex-wrap gap-2">
                      {GOLD_CARAT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                          <input
                            type="radio"
                            name="gold_carat"
                            value={opt.value}
                            checked={form.gold_carat === opt.value}
                            onChange={(e) => {
                              setForm((f) => ({ ...f, gold_carat: Number(e.target.value) }));
                              setCustomGoldCarat(null);
                            }}
                            className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-500 dark:text-slate-100"
                          />
                          {opt.label}
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name="gold_carat"
                          value="Other"
                          checked={!GOLD_CARAT_OPTIONS.some(opt => opt.value === form.gold_carat) && form.gold_carat !== 0}
                          onChange={() => {
                            setForm((f) => ({ ...f, gold_carat: customGoldCarat ?? 0 }));
                          }}
                          className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-500 dark:text-slate-100"
                        />
                        Other
                      </label>
                      {(!GOLD_CARAT_OPTIONS.some(opt => opt.value === form.gold_carat) && form.gold_carat !== 0) && (
                        <input
                          type="number"
                          placeholder="Carat value"
                          step="0.1"
                          value={customGoldCarat ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : 0;
                            setCustomGoldCarat(val);
                            setForm((f) => ({ ...f, gold_carat: val }));
                          }}
                          className="rounded-full border border-slate-300 px-3 py-2 text-sm w-24"
                        />
                      )}
                    </div>
                  </div>

                  {/* Metal Weight / Rate */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Gold Weight (g)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={form.gold_weight}
                        onChange={(e) => setForm((f) => ({ ...f, gold_weight: Number(e.target.value || 0) }))}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Total Weight (g)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={form.total_weight}
                        onChange={(e) => setForm((f) => ({ ...f, total_weight: Number(e.target.value || 0) }))}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Metal Rate & Total Metal Price */}
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Metal Rate (per gram)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.metal_rate}
                        onChange={(e) => setForm((f) => ({ ...f, metal_rate: Number(e.target.value || 0) }))}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Total Metal Price</label>
                      <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {form.total_metal_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labour & Profit */}
                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    Pricing Adjustments
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Labour Cost</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.labour}
                        onChange={(e) => setForm((f) => ({ ...f, labour: Number(e.target.value || 0) }))}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Profit %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form.profit_percent}
                        onChange={(e) => setForm((f) => ({ ...f, profit_percent: Number(e.target.value || 0) }))}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Profit Amount:</span> <span className="font-semibold">{form.profit_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Final Price (computed):</span> <span className="font-semibold">{((form.total_diamond_price + form.total_metal_price + form.labour + form.profit_amount) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Short / Full Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Short Description</label>
                  <textarea rows={2} value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Full Description</label>
                  <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                </div>

                {/* Published checkbox */}
                <div className="flex items-center gap-2">
                  <input id="is_published" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
                  <label htmlFor="is_published" className="text-sm text-slate-700 dark:text-slate-200">Published</label>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500 hidden sm:block">Required fields *</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100">Cancel</button>
                    <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                      {saving ? <Loader2 className="animate-spin" size={16} /> : (modalMode === "create" ? "Create Product" : "Save Changes")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Diamond Modal (add/edit) */}
      {diamondModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-semibold">{editingDiamondIndex !== null ? "Edit Gemstone" : "Add Gemstone"}</h3>
                <button onClick={() => setDiamondModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="space-y-3">
                {/* Type */}
                <div>
                  <label className="text-sm">Type</label>
                  <select
                    value={showOtherTypeInput ? "Other" : currentDiamond.type}
                    onChange={handleTypeChange}
                    className="w-full rounded-lg border p-2 text-base"
                  >
                    {DIAMOND_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  {showOtherTypeInput && (
                    <input
                      type="text"
                      placeholder="Specify other type"
                      value={otherTypeValue}
                      onChange={handleOtherTypeInputChange}
                      className="w-full mt-2 rounded-lg border p-2"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Pieces</label>
                    <input type="number" min={1} value={currentDiamond.pcs} onChange={(e) => setCurrentDiamond({...currentDiamond, pcs: Number(e.target.value)})} className="w-full rounded-lg border p-2" />
                  </div>
                  <div>
                    <label className="text-sm">Carat</label>
                    <input type="number" min={0} step={0.001} value={currentDiamond.carat} onChange={(e) => setCurrentDiamond({...currentDiamond, carat: Number(e.target.value)})} className="w-full rounded-lg border p-2" />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Rate (per carat)</label>
                  <input type="number" min={0} step="0.01" value={currentDiamond.rate} onChange={(e) => setCurrentDiamond({...currentDiamond, rate: Number(e.target.value)})} className="w-full rounded-lg border p-2" />
                </div>
                {/* Color, Clarity, Shape with custom inputs */}
                <div>
                  <label className="text-sm">Color</label>
                  <select
                    value={currentDiamond.color}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") return;
                      setCurrentDiamond({ ...currentDiamond, color: val });
                    }}
                    className="w-full rounded-lg border p-2"
                  >
                    {DIAMOND_COLOR_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    <option value="__CUSTOM__">Custom</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter custom color"
                    value={!DIAMOND_COLOR_OPTIONS.includes(currentDiamond.color) && currentDiamond.color ? currentDiamond.color : ""}
                    onChange={(e) => setCurrentDiamond({ ...currentDiamond, color: e.target.value })}
                    className="w-full mt-2 rounded-lg border p-2"
                  />
                </div>
                <div>
                  <label className="text-sm">Clarity</label>
                  <select
                    value={currentDiamond.clarity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") return;
                      setCurrentDiamond({ ...currentDiamond, clarity: val });
                    }}
                    className="w-full rounded-lg border p-2"
                  >
                    {DIAMOND_CLARITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    <option value="__CUSTOM__">Custom</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter custom clarity"
                    value={!DIAMOND_CLARITY_OPTIONS.includes(currentDiamond.clarity) && currentDiamond.clarity ? currentDiamond.clarity : ""}
                    onChange={(e) => setCurrentDiamond({ ...currentDiamond, clarity: e.target.value })}
                    className="w-full mt-2 rounded-lg border p-2"
                  />
                </div>
                <div>
                  <label className="text-sm">Shape</label>
                  <select
                    value={currentDiamond.shape || "Round"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") return;
                      setCurrentDiamond({ ...currentDiamond, shape: val });
                    }}
                    className="w-full rounded-lg border p-2"
                  >
                    {DIAMOND_SHAPE_OPTIONS.map(shape => <option key={shape}>{shape}</option>)}
                    <option value="__CUSTOM__">Custom</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter custom shape"
                    value={!DIAMOND_SHAPE_OPTIONS.includes(currentDiamond.shape || "") && currentDiamond.shape ? currentDiamond.shape : ""}
                    onChange={(e) => setCurrentDiamond({ ...currentDiamond, shape: e.target.value })}
                    className="w-full mt-2 rounded-lg border p-2"
                  />
                </div>
                <div>
                  <label className="text-sm">Packet No. (optional)</label>
                  <input type="text" value={currentDiamond.packet_no || ""} onChange={(e) => setCurrentDiamond({...currentDiamond, packet_no: e.target.value})} className="w-full rounded-lg border p-2" />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setDiamondModalOpen(false)} className="rounded-full border px-4 py-2">Cancel</button>
                <button onClick={saveDiamond} className="rounded-full bg-slate-900 px-4 py-2 text-white">Save</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* View Diamonds Modal */}
      {viewDiamondsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl mx-4 my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Gemstone Details</h3>
                <button onClick={() => setViewDiamondsOpen(false)} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>
              {viewingDiamonds.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">No gemstones added.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[500px] w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Pcs</th>
                        <th className="px-3 py-2">Carat</th>
                        <th className="px-3 py-2">Rate</th>
                        <th className="px-3 py-2">Total</th>
                        <th className="px-3 py-2">Color</th>
                        <th className="px-3 py-2">Clarity</th>
                        <th className="px-3 py-2">Shape</th>
                        <th className="px-3 py-2">Packet No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingDiamonds.map((d, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{d.diamond_type || "Diamond"}</td>
                          <td className="px-3 py-2">{d.pcs}</td>
                          <td className="px-3 py-2">{d.carat}</td>
                          <td className="px-3 py-2">{d.rate}</td>
                          <td className="px-3 py-2">{(Number(d.carat) * Number(d.rate)).toFixed(2)}</td>
                          <td className="px-3 py-2">{d.color || "—"}</td>
                          <td className="px-3 py-2">{d.clarity || "—"}</td>
                          <td className="px-3 py-2">{d.shape || "—"}</td>
                          <td className="px-3 py-2">{d.packet_no || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={() => setViewDiamondsOpen(false)} className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

       {/* ASSET MODAL */}
      {assetModalOpen &&
        assetProduct &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl mx-4 my-8 rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/minal_gems_logo.svg" className="h-8 sm:h-10 w-auto" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Manage Media</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      for: <span className="font-semibold">{assetProduct.title}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setAssetModalOpen(false)} className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <ImageIcon size={16} className="inline mr-1" /> Primary media appears on listings.
                </div>
                <div>
                  <button type="button" onClick={handleAssetsUploadClick} disabled={assetsSaving} className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {assetsSaving ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                    Upload Media
                  </button>
                  <input
                    ref={assetsFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleAssetsFileChange}
                  />
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                {assetsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                    <Loader2 className="mb-2 animate-spin" size={20} />
                    Loading media...
                  </div>
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                    <ImageIcon size={24} className="mb-2" />
                    <p>No media uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {assets.map((asset) => {
                      const isImage = asset.asset_type === "image";
                      const isVideo = asset.asset_type === "video";
                      return (
                        <div key={asset.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                          <div className="relative h-32 sm:h-40 w-full bg-slate-100 dark:bg-slate-900">
                            {isImage ? (
                              <img src={getAssetUrl(asset.url)} alt={asset.filename || ""} className="h-full w-full object-cover" />
                            ) : isVideo ? (
                              <video src={getAssetUrl(asset.url)} className="h-full w-full object-cover" controls muted />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
                                <Video size={32} />
                              </div>
                            )}
                            {asset.is_primary && (
                              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                                <Star size={12} /> Primary
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                            <span className="truncate">{asset.filename || "Media"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 px-3 pb-3 text-xs">
                            <button onClick={() => handleSetPrimaryAsset(asset)} className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                              <Star size={12} /> Set Primary
                            </button>
                            <button onClick={() => handleDeleteAsset(asset)} className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                              <Trash size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setAssetModalOpen(false)} className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProductsPage;