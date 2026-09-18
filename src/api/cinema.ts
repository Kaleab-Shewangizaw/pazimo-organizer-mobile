import { apiRequest } from "@/api/client";
import type {
  CinemaCashierContextResponse,
  CinemaCheckInOrderResponse,
  CinemaCheckInTicketResponse,
  CinemaConcessionSalesSummaryResponse,
  CinemaConcessionsResponse,
  CinemaFinanceResponse,
  CinemaProfileResponse,
  CinemaRedeemConcessionResponse,
  CinemaStaffOrderResponse,
  CinemaStaffTicketResponse,
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

/**
 * Door/counter scanner surface — mirrors the web dashboard's
 * components/cinema/cinema-scanner.tsx call-for-call. Two kinds of code exist
 * (see CinemaStaffTicket doc comment): a single-seat ticket code and a
 * whole-order code covering every seat bought in one checkout. Every read here
 * is a preview only; nothing is admitted or collected until the matching
 * mutation below is called.
 */

/**
 * GET /api/cinemas/me/tickets/:ticketId — a ticket by its scannable code,
 * read-only, BEFORE admitting it. Never throws for an already-used or
 * refunded ticket; it returns the real status so the scanner can show that
 * instead of a bare error.
 */
export function getCinemaStaffTicket(ticketId: string) {
  return apiRequest<CinemaStaffTicketResponse>(`/cinemas/me/tickets/${encodeURIComponent(ticketId)}`);
}

/**
 * POST /api/cinemas/me/check-in/:ticketId — admits the holder. Omit
 * `seatKeys` to admit every seat still outstanding on this ticket (the whole
 * thing, on an unassigned-seating hall); pass specific seat keys to admit
 * only some of a multi-seat ticket, letting a group walk in as they arrive.
 */
export function checkInCinemaTicket(ticketId: string, seatKeys?: string[]) {
  return apiRequest<CinemaCheckInTicketResponse>(
    `/cinemas/me/check-in/${encodeURIComponent(ticketId)}`,
    seatKeys && seatKeys.length > 0 ? { method: "POST", body: { seatKeys } } : { method: "POST" },
  );
}

/**
 * GET /api/cinemas/me/orders/:reference — every seat sharing one payment
 * reference, for the scanner to review before admitting the whole order.
 */
export function getCinemaStaffOrder(reference: string) {
  return apiRequest<CinemaStaffOrderResponse>(`/cinemas/me/orders/${encodeURIComponent(reference)}`);
}

/**
 * POST /api/cinemas/me/orders/:reference/check-in — admits every eligible
 * seat on the order at once, or just the seats named in `seatKeys` (which may
 * span more than one ticket document when an order mixes ticket tiers).
 */
export function checkInCinemaOrder(reference: string, seatKeys?: string[]) {
  return apiRequest<CinemaCheckInOrderResponse>(
    `/cinemas/me/orders/${encodeURIComponent(reference)}/check-in`,
    seatKeys && seatKeys.length > 0 ? { method: "POST", body: { seatKeys } } : { method: "POST" },
  );
}

/**
 * POST /api/cinemas/me/concession-sales/:saleId/redeem — hands a pre-bought
 * drink/snack over at the counter. Only valid for a confirmed, not-yet-
 * collected, online-channel sale; a counter sale was already handed over when
 * it was rung up.
 */
export function redeemCinemaConcession(saleId: string) {
  return apiRequest<CinemaRedeemConcessionResponse>(
    `/cinemas/me/concession-sales/${encodeURIComponent(saleId)}/redeem`,
    { method: "POST" },
  );
}

/**
 * GET /api/cinemas/me/context — a cashier-safe read of just the cinema's
 * name, for the account screen. Reachable by both a cinema owner and a
 * cashier scoped to it (unlike getCinemaProfile/GET /me, which is owner-only).
 */
export function getCinemaCashierContext() {
  return apiRequest<CinemaCashierContextResponse>("/cinemas/me/context");
}
