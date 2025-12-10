import { apiFetch } from "../lib/apiClient";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  data: any;
  target_query: any;
  scheduled_at: string | null;
  sent: boolean;
  created_at: string;
}

export interface NotificationsListResponse {
  ok: boolean;
  items: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateNotificationPayload {
  title: string;
  body?: string;
  data?: any;
  target_query?: any;
  scheduled_at?: string | null;
}

export async function fetchLatestNotifications(
  limit = 8
): Promise<NotificationItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const res = await apiFetch<NotificationsListResponse>(
    `/notifications?${params.toString()}`
  );
  return res.items || [];
}

export async function listNotifications(options?: {
  page?: number;
  limit?: number;
  q?: string;
  sent?: "true" | "false";
}): Promise<NotificationsListResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.q) params.set("q", options.q);
  if (options?.sent) params.set("sent", options.sent);

  const res = await apiFetch<NotificationsListResponse>(
    `/notifications?${params.toString()}`
  );
  return res;
}

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<NotificationItem> {
  const res = await apiFetch<{ ok: boolean; notification: NotificationItem }>(
    "/notifications",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return res.notification;
}
