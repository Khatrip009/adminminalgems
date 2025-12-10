// src/products.api.ts
import { apiFetch, type ApiResponse } from "../lib/apiClient";

/* =========================================================
   Types
========================================================= */

export type TradeType = "import" | "export" | "both";

export interface Product {
  id: string;
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
  // optional columns (meta / seo etc.)
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
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

/* =========================================================
   PUBLIC PRODUCTS
   (GET /products, GET /products/:slug)
========================================================= */

const BASE = "/products";

// Public list: GET /products
export async function fetchPublicProducts(): Promise<ApiResponse & { products: Product[] }> {
  return apiFetch(`${BASE}`);
}

// Public detail by slug: GET /products/:slug
export async function fetchProductBySlug(
  slug: string
): Promise<ProductResponse> {
  return apiFetch(`${BASE}/${encodeURIComponent(slug)}`);
}

/* =========================================================
   ADMIN PRODUCTS
   (GET /admin, GET /admin/:id, POST /, PUT /admin/:id, DELETE /admin/:id)
========================================================= */

export interface FetchProductsAdminParams {
  q?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  page?: number;
  limit?: number;
}

// GET /products/admin
export async function fetchProductsAdmin(
  params: FetchProductsAdminParams = {}
): Promise<ProductsAdminListResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.category_id) searchParams.set("category_id", params.category_id);
  if (params.trade_type) searchParams.set("trade_type", params.trade_type);
  if (typeof params.is_published === "boolean") {
    searchParams.set("is_published", params.is_published ? "true" : "false");
  }
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = `${BASE}/admin${qs ? `?${qs}` : ""}`;

  return apiFetch(url);
}

// GET /products/admin/:id
export async function fetchProductAdmin(id: string): Promise<ProductResponse> {
  return apiFetch(`${BASE}/admin/${encodeURIComponent(id)}`);
}

export interface CreateProductPayload {
  sku?: string | null;
  title: string;
  slug: string;
  price: number;
  currency?: string;
  short_description?: string | null;
  description?: string | null;
  category_id?: string | null;
  trade_type?: TradeType;
  is_published?: boolean;
  metadata?: any;
  moq?: number;
  available_qty?: number;
}

// POST /products
export async function createProductAdmin(
  payload: CreateProductPayload
): Promise<ProductResponse> {
  return apiFetch(`${BASE}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateProductPayload {
  sku?: string | null;
  title?: string;
  slug?: string;
  price?: number;
  currency?: string;
  short_description?: string | null;
  description?: string | null;
  category_id?: string | null;
  trade_type?: TradeType;
  is_published?: boolean;
  metadata?: any;
  moq?: number;
  available_qty?: number;
}

// PUT /products/admin/:id
export async function updateProductAdmin(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductResponse> {
  return apiFetch(`${BASE}/admin/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// DELETE /products/admin/:id
export async function deleteProductAdmin(id: string): Promise<ApiResponse> {
  return apiFetch(`${BASE}/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   PRODUCT ASSETS
   (POST /:id/assets, GET /:id/assets,
    PATCH /assets/:assetId/set-primary,
    DELETE /assets/:assetId)
========================================================= */

// GET /products/:id/assets
export async function fetchProductAssets(
  productId: string
): Promise<ProductAssetsResponse> {
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`);
}

// POST /products/:id/assets  (FormData)
export async function uploadProductAssets(
  productId: string,
  formData: FormData
): Promise<ProductAssetsResponse> {
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`, {
    method: "POST",
    body: formData,
  });
}

// PATCH /products/assets/:assetId/set-primary
export async function setPrimaryProductAsset(
  assetId: string
): Promise<ApiResponse & { asset?: ProductAsset }> {
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}/set-primary`, {
    method: "PATCH",
  });
}

// DELETE /products/assets/:assetId
export async function deleteProductAsset(
  assetId: string
): Promise<ApiResponse> {
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
}
