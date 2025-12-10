// src/users.api.ts
import { apiFetch } from "../lib/apiClient";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListUsersParams {
  q?: string;
  role_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ListUsersResponse {
  ok: boolean;
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<ListUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.role_id != null) searchParams.set("role_id", String(params.role_id));
  if (params.is_active != null)
    searchParams.set("is_active", params.is_active ? "true" : "false");
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const url = `/users${query ? `?${query}` : ""}`;

  return apiFetch(url, { method: "GET" });
}

export async function getUser(id: string): Promise<{ ok: boolean; user: AdminUser }> {
  return apiFetch(`/users/${id}`, { method: "GET" });
}

export interface CreateUserPayload {
  email: string;
  full_name?: string;
  role_id: number;
  password: string;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<{ ok: boolean; user: AdminUser }> {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateUserPayload {
  email?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
  password?: string;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<{ ok: boolean; user: AdminUser }> {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}
