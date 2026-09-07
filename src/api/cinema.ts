import { apiRequest } from "@/api/client";
import type {
  CinemaConcessionSalesSummaryResponse,
  CinemaConcessionsResponse,
  CinemaFinanceResponse,
  CinemaProfileResponse,
  CinemaTicketSalesResponse,
  CinemaTicketSummaryResponse,
  Currency,
} from "@/types";

/**
 * All of these hit backend/src/routes/cinemaRoutes.js's `/me/*` surface —
 * gated by `cinemaSelf` (authenticateUser + restrictTo('cinema') +
 * requireCinemaAccount), which resolves the calling cinema from the
 * account, never from a client-supplied id. This is the "cashier" role in
 * this app's UI — "cinema" is the backend's name for the same account.
 */

export function getCinemaProfile() {
  return apiRequest<CinemaProfileResponse>("/cinemas/me");
}

/**
 * GET /api/cinemas/me/finance — combined + per-stream (tickets vs
 * beverages) balance. See `backend/src/services/cinemaFinanceService.js`
 * calculateCinemaBalance for the exact shape mirrored in `CinemaFinanceResponse`.
 */
export function getCinemaFinance(currency: Currency = "ETB") {
  return apiRequest<CinemaFinanceResponse>(`/cinemas/me/finance?currency=${currency}`);
}

export function getCinemaTicketSummary() {
  return apiRequest<CinemaTicketSummaryResponse>("/cinemas/me/ticket-sales/summary");
}

export function getCinemaTicketSales(page = 1, limit = 30) {
  return apiRequest<CinemaTicketSalesResponse>(
    `/cinemas/me/ticket-sales?page=${page}&limit=${limit}`,
  );
}

export function getCinemaConcessions() {
  return apiRequest<CinemaConcessionsResponse>("/cinemas/me/concessions");
}

export function getCinemaConcessionSalesSummary() {
  return apiRequest<CinemaConcessionSalesSummaryResponse>(
    "/cinemas/me/concession-sales/summary",
  );
}
