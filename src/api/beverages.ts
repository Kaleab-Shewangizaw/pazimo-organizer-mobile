import { apiRequest } from "@/api/client";
import type {
  BeverageCatalogResponse,
  BeverageDashboardResponse,
  BeverageEligibilityResponse,
  EventBeverageLineupResponse,
  HappyHourListResponse,
  HappyHourMutationResponse,
  OrganizerBeverageSalesResponse,
} from "@/types";

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

/**
 * GET /api/beverages/organizer/catalog — this organizer's active, sellable
 * drinks, each with an image. The dashboard's per-drink revenue rows don't
 * carry one themselves (see BeverageCatalogItem); the Bar tab cross-
 * references this by id to show a thumbnail.
 */
export function getOrganizerBeverageCatalog() {
  return apiRequest<BeverageCatalogResponse>("/beverages/organizer/catalog");
}

/** GET /api/beverages/organizer/events/:eventId/beverages — this event's drink line-up. */
export function getEventBeverageLineup(eventId: string) {
  return apiRequest<EventBeverageLineupResponse>(`/beverages/organizer/events/${eventId}/beverages`);
}

/**
 * GET /api/beverages/organizer/events/:eventId/happy-hours — every happy-hour
 * campaign ever created for this event (backend/src/controllers/
 * beverageController.js listEventHappyHours), newest first, each with its
 * derived `state` and populated drink names.
 */
export function listEventHappyHours(eventId: string) {
  return apiRequest<HappyHourListResponse>(`/beverages/organizer/events/${eventId}/happy-hours`);
}

export interface CreateHappyHourInput {
  /** At least one — {eventBeverageId, price}, price strictly below that drink's regular price. */
  items: { eventBeverageId: string; price: number }[];
  durationMinutes: number;
  startMode: "manual" | "scheduled";
  /** Required (and must be in the future) when startMode is "scheduled". */
  scheduledStartAt?: string;
}

/**
 * POST /api/beverages/organizer/events/:eventId/happy-hours — publish a new
 * campaign. A "manual" one is created in the "scheduled, awaiting Start now"
 * state — see startEventHappyHour.
 */
export function createEventHappyHour(eventId: string, input: CreateHappyHourInput) {
  return apiRequest<HappyHourMutationResponse>(`/beverages/organizer/events/${eventId}/happy-hours`, {
    method: "POST",
    body: { ...input },
  });
}

/** POST .../happy-hours/:id/start — only valid for a "manual" campaign that hasn't started yet. */
export function startEventHappyHour(eventId: string, happyHourId: string) {
  return apiRequest<HappyHourMutationResponse>(
    `/beverages/organizer/events/${eventId}/happy-hours/${happyHourId}/start`,
    { method: "POST" },
  );
}

/** DELETE .../happy-hours/:id — cancels (never deletes) a scheduled or active campaign. */
export function cancelEventHappyHour(eventId: string, happyHourId: string) {
  return apiRequest<HappyHourMutationResponse>(
    `/beverages/organizer/events/${eventId}/happy-hours/${happyHourId}`,
    { method: "DELETE" },
  );
}

export interface ListOrganizerSalesParams {
  eventId?: string;
  /** Inclusive lower bound on soldAt, compared exactly (unlike `to` below). */
  from?: string;
  /**
   * Inclusive upper bound on soldAt — but the backend rounds it up to the
   * end of that calendar day (buildDateRange in beverageSalesController.js),
   * not an exact timestamp. Fine for a day-range report; too coarse for a
   * happy hour's minutes-wide window, so callers wanting that precision
   * should omit `to` and filter the results by exact soldAt themselves.
   */
  to?: string;
  status?: "confirmed" | "refunded" | "all";
  page?: number;
  limit?: number;
}

/**
 * GET /api/beverages/organizer/sales — the raw sale ledger (not the
 * byBeverage/byEvent revenue aggregates), so callers can inspect individual
 * sales' eventBeverage/soldAt — e.g. to work out which sales fell inside a
 * specific happy-hour campaign's window (see the OrganizerBeverageSaleRow
 * doc comment for why that isn't a stored field).
 */
export function listOrganizerBeverageSales(params: ListOrganizerSalesParams) {
  const query = new URLSearchParams();
  if (params.eventId) query.set("eventId", params.eventId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<OrganizerBeverageSalesResponse>(`/beverages/organizer/sales${qs ? `?${qs}` : ""}`);
}
