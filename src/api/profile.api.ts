// src/api/profile.api.ts
import { apiFetch, apiFetchRaw } from "../lib/apiClient";

export interface Profile {
  id: string;
  user_id: string;
  public_name: string | null;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  company: string | null;
  website: string | null;
  social_links: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileMeResponse {
  ok: boolean;
  profile: Profile | null;
}

export interface UpdateProfilePayload {
  public_name?: string;
  slug?: string;
  bio?: string;
  location?: string;
  company?: string;
  website?: string;
  social_links?: Record<string, any>;
  metadata?: Record<string, any>;
}

/* ---------------------------------------------------
 * GET MY PROFILE
 * GET /profile/me
 * --------------------------------------------------- */
export async function getMyProfile(): Promise<Profile | null> {
  const res = await apiFetch<ProfileMeResponse>("/profile/me");
  return res.profile || null;
}

/* ---------------------------------------------------
 * UPDATE MY PROFILE
 * PUT /profile
 * --------------------------------------------------- */
export async function updateProfile(data: UpdateProfilePayload) {
  return apiFetch("/profile", {
    method: "PUT",
    body: data,
  });
}

/* ---------------------------------------------------
 * UPLOAD AVATAR
 * POST /profile/avatar
 * --------------------------------------------------- */
export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);

  const res = await apiFetchRaw("/profile/avatar", {
    method: "POST",
    body: form,
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid_response" };
  }
}

/* ---------------------------
   CHANGE PASSWORD
----------------------------*/
export async function changePassword(oldPassword: string, newPassword: string) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: { old_password: oldPassword, new_password: newPassword },
  });
}

/* ---------------------------
   LOGIN HISTORY
----------------------------*/
export async function fetchLoginHistory() {
  return apiFetch("/security/logins");
}

/* ---------------------------
   SECURITY ALERTS
----------------------------*/
export async function fetchSecurityAlerts() {
  return apiFetch("/security/alerts");
}