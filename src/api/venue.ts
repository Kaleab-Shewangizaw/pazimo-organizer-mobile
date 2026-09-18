import { apiRequest } from "@/api/client";
import type {
  VenueIdentityResponse,
  VenueOutstandingOrderResponse,
  VenueRedeemSaleResponse,
} from "@/types";

/**
 * Venue counter surface — mirrors the web dashboard's
 * components/venue/venue-scanner.tsx call-for-call. A venue sells only
 * drinks, so unlike the cinema there is one kind of code (the bare payment
 * reference) and one kind of item; every read here is a preview only, and
 * nothing is handed over until redeemVenueSale is called.
 *
 * Every call is scoped by `venueId`, which for a cashier account is the
 * `venue` field on the signed-in user (see authController.js login()) — a
 * cashier cannot reach GET /api/venues/me to look this up itself.
 */

/**
 * GET /api/venues/:venueId/sales/outstanding/:paymentReference — every
 * unclaimed drink on this order, read-only, BEFORE handing anything over.
 */
export function getOutstandingVenueOrder(venueId: string, paymentReference: string) {
  return apiRequest<VenueOutstandingOrderResponse>(
    `/venues/${encodeURIComponent(venueId)}/sales/outstanding/${encodeURIComponent(paymentReference)}`,
  );
}

/**
 * POST /api/venues/:venueId/sales/:saleId/redeem — hands one pre-bought
 * drink over at the counter.
 */
export function redeemVenueSale(venueId: string, saleId: string) {
  return apiRequest<VenueRedeemSaleResponse>(
    `/venues/${encodeURIComponent(venueId)}/sales/${encodeURIComponent(saleId)}/redeem`,
    { method: "POST" },
  );
}

/**
 * GET /api/venues/:venueId/beverages — a cashier can't reach GET
 * /venues/me (owner-only), so this reuses the already cashier-safe
 * beverages endpoint purely for the `venue` identity it carries alongside
 * the line-up, for the account screen's "which venue am I" label.
 */
export function getVenueIdentity(venueId: string) {
  return apiRequest<VenueIdentityResponse>(`/venues/${encodeURIComponent(venueId)}/beverages`);
}
