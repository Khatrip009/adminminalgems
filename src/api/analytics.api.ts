// src/analytics.api.ts

import { apiFetch } from "../lib/apiClient";

/** Visitor metrics from /visitor-metrics/summary */
export interface VisitorMetrics {
  total_visitors: number;
  visitors_today: number;
  page_views_today: number;
  new_visitors_today: number;
}

export interface VisitorSummaryResponse {
  ok: boolean;
  metrics: VisitorMetrics;
}

/** Admin review stats from /admin/reviews/stats */
export interface AdminReviewStats {
  total_reviews: number;
  published_reviews: number;
  avg_rating: number | null;
}

export interface AdminReviewStatsResponse {
  ok: boolean;
  stats: AdminReviewStats;
}

/** Public review stats from /reviews/stats (used for global rating display) */
export interface PublicReviewStats {
  avg_rating: number | null;
  total_reviews: number;
}

export interface PublicReviewStatsResponse {
  ok: boolean;
  stats: PublicReviewStats;
}

/**
 * GET /visitor-metrics/summary
 * Adjust the base path if you mounted the router differently.
 */
export async function getVisitorSummary(): Promise<VisitorSummaryResponse> {
   return apiFetch("/metrics/visitors/summary");
}

/**
 * GET /admin/reviews/stats
 */
export async function getAdminReviewStats(): Promise<AdminReviewStatsResponse> {
  return apiFetch<AdminReviewStatsResponse>("/admin/reviews/stats");
}

/**
 * GET /reviews/stats
 * Public global rating stats.
 */
export async function getPublicReviewStats(): Promise<PublicReviewStatsResponse> {
  return apiFetch<PublicReviewStatsResponse>("/reviews/stats");
}
