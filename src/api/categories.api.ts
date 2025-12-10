// src/api/categories.api.ts
import { apiFetch } from "../lib/apiClient";

export type TradeType = "import" | "export" | "both";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  trade_type: TradeType;
  sort_order?: number;
  // Only present when include_counts=true
  product_count?: number;
}

export interface CategoryListResponse {
  ok: boolean;
  categories: Category[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface CategorySingleResponse {
  ok: boolean;
  category: Category;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  trade_type?: TradeType;
}

export interface UpdateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  trade_type?: TradeType;
}

/**
 * Small helper to attach query params.
 */
function buildQuery(params: Record<string, any | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      continue;
    }
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/**
 * Fetch paginated categories.
 * Backend: GET /api/categories
 */
export async function fetchCategories(options: {
  q?: string;
  trade_type?: TradeType;
  page?: number;
  limit?: number;
  includeCounts?: boolean;
} = {}): Promise<CategoryListResponse> {
  const query = buildQuery({
    q: options.q,
    trade_type: options.trade_type,
    page: options.page,
    limit: options.limit,
    include_counts: options.includeCounts ? "true" : undefined,
  });

  return apiFetch<CategoryListResponse>(`/categories${query}`, {
    method: "GET",
  });
}

/**
 * Get single category by id.
 * Backend: GET /api/categories/:id
 */
export async function fetchCategoryById(id: string): Promise<CategorySingleResponse> {
  return apiFetch<CategorySingleResponse>(`/categories/${id}`, {
    method: "GET",
  });
}

/**
 * Create a category.
 * Backend: POST /api/categories
 */
export async function createCategory(
  payload: CreateCategoryInput
): Promise<CategorySingleResponse> {
  return apiFetch<CategorySingleResponse>("/categories", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update a category.
 * Backend: PUT /api/categories/:id
 */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryInput
): Promise<CategorySingleResponse> {
  return apiFetch<CategorySingleResponse>(`/categories/${id}`, {
    method: "PUT",
    body: payload,
  });
}

/**
 * Delete a category.
 * Backend: DELETE /api/categories/:id
 */
export async function deleteCategory(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/categories/${id}`, {
    method: "DELETE",
  });
}

/**
 * Optional: grouped export if you like object-style imports.
 */
export const CategoriesApi = {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
