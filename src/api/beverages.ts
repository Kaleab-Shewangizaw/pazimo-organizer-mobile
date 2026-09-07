import { apiRequest } from "@/api/client";
import type { BeverageDashboardResponse, BeverageEligibilityResponse } from "@/types";

/**
 * Backend: GET /api/beverages/organizer/eligibility. Always readable (unlike
 * the rest of the beverage surface, which 403s until an admin marks the
 * organizer eligible) — "that's how the organizer app decides whether to
 * show the feature at all" per the route's own comment. The Bar tab checks
 * this first and shows a gate screen instead of a 403 banner when it isn't
 * "eligible".
 */
export function getBeverageEligibility() {
  return apiRequest<BeverageEligibilityResponse>("/beverages/organizer/eligibility");
}

/**
 * Backend: GET /api/beverages/organizer/dashboard
 * (backend/src/controllers/beverageSalesController.js buildDashboard).
 * 403s with a clear message if the organizer isn't beverage-eligible yet —
 * only call this after getBeverageEligibility() confirms "eligible".
 */
export function getOrganizerBeverageDashboard() {
  return apiRequest<BeverageDashboardResponse>("/beverages/organizer/dashboard");
}
