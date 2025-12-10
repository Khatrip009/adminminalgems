// src/api/client.ts

// src/api/client.ts

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://apiminalgems.exotech.co.in/api";

function getToken(): string | null {
  return localStorage.getItem("mg_admin_token");
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Attach JWT
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;

  // Add JSON content-type only if needed
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // ➤ FIX: Only stringify when needed
  let bodyToSend = options.body;

  if (options.method && options.method !== "GET") {
    if (!isFormData) {
      if (typeof options.body === "string") {
        bodyToSend = options.body; // already JSON
      } else {
        bodyToSend = JSON.stringify(options.body || {});
      }
    }
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers,
      body: bodyToSend,
      credentials: "include",
    });
  } catch {
    throw new Error("Cannot reach API server. Is backend running?");
  }

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed with status ${res.status}`;

    const err: any = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

/**
 * RAW fetch helper (used for binary downloads: PDF, CSV, ZIP)
 * Does NOT parse JSON.
 */
export async function apiFetchRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Attach token
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  return res;
}
