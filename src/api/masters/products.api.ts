// src/api/products.api.ts
import { apiFetch, API_ROUTES, type ApiResponse } from "@/lib/apiClient";
import { getAuthToken } from "@/utils/getAuthToken";

// ★ Absolute backend URL (e.g. http://localhost:4500)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/* =========================================================
   TYPES (unchanged)
========================================================= */

export type TradeType = "import" | "export" | "both";

export interface Diamond {
  id: string;
  product_id: string;
  diamond_type: string;
  shape: string;
  color: string | null;
  clarity: string | null;
  carat: number;
  pcs: number;
  rate: number;
  total_price: number;
  packet_no: string | null;
  sort_order: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  item_no: string | null;
  sku: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  currency: string;
  moq: number;
  available_qty: number;
  is_published: boolean;
  metadata: any;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  trade_type: TradeType;
  primary_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  total_diamond_pcs: number;
  total_diamond_carat: number;
  total_diamond_price: number;
  metal_type: string;
  gold_carat: number;
  metal_rate: number;
  total_metal_price: number;
  total_weight: number;
  gold_weight: number;
  labour: number;
  profit_percent: number;
  profit_amount: number;
  craftsman_id?: string | null;
  craftsman_name?: string | null;
  diamonds?: Diamond[];
}

export interface ProductAsset {
  id: string;
  product_id: string;
  asset_type: "image" | "video" | "3d" | "other";
  url: string;
  filename: string | null;
  file_type: string | null;
  width: number | null;
  height: number | null;
  filesize: number | null;
  is_primary: boolean;
  sort_order: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ProductsAdminListResponse extends ApiResponse {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductResponse extends ApiResponse {
  product: Product;
}

export interface ProductAssetsResponse extends ApiResponse {
  assets: ProductAsset[];
}

export interface ProductDiamondsResponse extends ApiResponse {
  diamonds: Diamond[];
}

/* =========================================================
   BASE + HELPERS (unchanged)
========================================================= */

const BASE = `${API_ROUTES.masters}/products`;
const ADMIN_BASE = `${BASE}/admin`;

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      q.append(k, String(v));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* =========================================================
   PUBLIC PRODUCTS
========================================================= */

export async function fetchPublicProducts() {
  return apiFetch<ApiResponse & { products: Product[] }>(BASE);
}

export async function fetchProductBySlug(slug: string): Promise<ProductResponse> {
  if (!slug) throw new Error("product_slug_required");
  return apiFetch(`${BASE}/${encodeURIComponent(slug)}`);
}

/* =========================================================
   ADMIN PRODUCTS
========================================================= */

export interface FetchProductsAdminParams {
  q?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  page?: number;
  limit?: number;
}

export async function fetchProductsAdmin(
  params: FetchProductsAdminParams = {}
): Promise<ProductsAdminListResponse> {
  return apiFetch(`${ADMIN_BASE}${buildQuery(params)}`);
}

export async function fetchProductAdmin(id: string): Promise<ProductResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`);
}

/* =========================================================
   CREATE / UPDATE PAYLOADS
========================================================= */

export interface CreateProductPayload {
  title: string;
  slug: string;
  price: number;
  currency?: string;
  short_description?: string;
  description?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  sku?: string | null;
  available_qty?: number;
  moq?: number;
  metadata?: any;
  item_no?: string | null;
  craftsman_id?: string | null;
  total_diamond_pcs?: number;
  total_diamond_carat?: number;
  total_diamond_price?: number;
  diamonds?: DiamondPayload[];
  metal_type?: string;
  gold_carat?: number;
  metal_rate?: number;
  total_metal_price?: number;
  total_weight?: number;
  gold_weight?: number;
  labour?: number;
  profit_percent?: number;
}

export interface UpdateProductPayload {
  title?: string;
  slug?: string;
  price?: number;
  currency?: string;
  short_description?: string;
  description?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  sku?: string | null;
  available_qty?: number;
  moq?: number;
  metadata?: any;
  item_no?: string | null;
  craftsman_id?: string | null;
  total_diamond_pcs?: number;
  total_diamond_carat?: number;
  total_diamond_price?: number;
  diamonds?: DiamondPayload[];
  metal_type?: string;
  gold_carat?: number;
  metal_rate?: number;
  total_metal_price?: number;
  total_weight?: number;
  gold_weight?: number;
  labour?: number;
  profit_percent?: number;
}

export interface DiamondPayload {
  diamond_type?: string;
  shape?: string;
  color?: string | null;
  clarity?: string | null;
  carat: number;
  pcs: number;
  rate: number;
  packet_no?: string | null;
  sort_order?: number;
}

export async function createProductAdmin(
  payload: CreateProductPayload
): Promise<ProductResponse> {
  return apiFetch(BASE, {
    method: "POST",
    body: payload,
  });
}

export async function updateProductAdmin(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteProductAdmin(id: string): Promise<ApiResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   PRODUCT ASSETS
========================================================= */

export async function fetchProductAssets(
  productId: string
): Promise<ProductAssetsResponse> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`);
}

export async function uploadProductAssets(
  productId: string,
  formData: FormData
): Promise<ProductAssetsResponse> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`, {
    method: "POST",
    body: formData,
  });
}

export async function setPrimaryProductAsset(
  assetId: string
): Promise<ApiResponse & { asset?: ProductAsset }> {
  if (!assetId) throw new Error("asset_id_required");
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}/set-primary`, {
    method: "PATCH",
  });
}

export async function deleteProductAsset(assetId: string): Promise<ApiResponse> {
  if (!assetId) throw new Error("asset_id_required");
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   DIAMOND CRUD
========================================================= */

export async function fetchProductDiamonds(
  productId: string
): Promise<ProductDiamondsResponse> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/diamonds`);
}

export async function addProductDiamond(
  productId: string,
  payload: DiamondPayload
): Promise<ApiResponse & { diamond: Diamond }> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/diamonds`, {
    method: "POST",
    body: payload,
  });
}

export async function updateProductDiamond(
  productId: string,
  diamondId: string,
  payload: Partial<DiamondPayload>
): Promise<ApiResponse & { diamond: Diamond }> {
  if (!productId || !diamondId) throw new Error("product_id_and_diamond_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/diamonds/${encodeURIComponent(diamondId)}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteProductDiamond(
  productId: string,
  diamondId: string
): Promise<ApiResponse> {
  if (!productId || !diamondId) throw new Error("product_id_and_diamond_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/diamonds/${encodeURIComponent(diamondId)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   CRAFTSMEN
========================================================= */

export interface Craftsman {
  id: string;
  name: string;
  code?: string;
}

export async function fetchCraftsmen(): Promise<Craftsman[]> {
  const res = await apiFetch<{ ok: boolean; craftsmen: Craftsman[] }>(
    `${API_ROUTES.masters}/craftsmen`
  );
  return res.craftsmen || [];
}

/* =========================================================
   PRODUCT REGISTER PDF – ABSOLUTE BACKEND URL
========================================================= */

/**
 * Download the Product Register PDF.
 * @param token - optional auth token (from useAuth). If omitted, tries to auto‑detect from localStorage.
 */
export async function downloadProductRegisterPDF(token?: string) {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error("Not authenticated. Please log in again.");
  }

  // ★ Hard‑coded correct path to avoid double /api
  const res = await fetch(`${API_BASE_URL}/masters/products/export/register`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) throw new Error("Failed to download product register");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `product_register_${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}