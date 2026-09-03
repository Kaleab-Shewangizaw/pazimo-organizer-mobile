import { apiRequest } from "@/api/client";
import type { Currency, OrganizerDashboardResponse } from "@/types";

/**
 * Backend: GET /api/organizers/:organizerId/dashboard
 * (backend/src/controllers/organizerController.js). One aggregation call
 * that returns the organizer's events already joined with per-event ticket
 * stats and revenue, plus a balance summary and recent withdrawals — this
 * is the only call the organizer home screen needs.
 */
export function getOrganizerDashboard(organizerId: string, currency: Currency = "ETB") {
  return apiRequest<OrganizerDashboardResponse>(
    `/organizers/${organizerId}/dashboard?currency=${currency}`,
  );
}
