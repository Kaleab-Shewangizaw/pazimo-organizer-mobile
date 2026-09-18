import { apiRequest } from "@/api/client";
import type {
  EventCashierAccessResponse,
  GenerateEventCashierCodeResponse,
  MyCashierEventsResponse,
  UnlockCashierEventResponse,
} from "@/types";

/**
 * The event-scoped twin of src/api/ushers.ts. Backend: backend/src/
 * controllers/eventCashierController.js. A cashier holds AT MOST ONE live
 * grant at a time (CashierEventAccess's partial unique index) — redeeming a
 * different event's code revokes whatever was live before, same as an
 * usher.
 */

/** GET /api/event-cashiers/my-events — the event this cashier currently has access to, if any. */
export function getMyCashierEvents() {
  return apiRequest<MyCashierEventsResponse>("/event-cashiers/my-events");
}

/**
 * POST /api/event-cashiers/unlock-event { code } — redeems a 6-character
 * event code. 404 "Invalid code" if it doesn't match anything; 400 if the
 * event is cancelled.
 */
export function unlockCashierEvent(code: string) {
  return apiRequest<UnlockCashierEventResponse>("/event-cashiers/unlock-event", {
    method: "POST",
    body: { code },
  });
}

/**
 * GET /api/event-cashiers/events/:eventId/code — admin or the event's own
 * organizer. The event's current code (null if none generated yet) plus
 * everyone who currently holds a live grant from it.
 */
export function getEventCashierAccess(eventId: string) {
  return apiRequest<EventCashierAccessResponse>(`/event-cashiers/events/${eventId}/code`);
}

/**
 * POST /api/event-cashiers/events/:eventId/code — admin or the event's own
 * organizer. Generates a fresh code, overwriting whatever code existed
 * before. Existing grants (CashierEventAccess) are untouched — this only
 * stops the *old* code from working for a new redemption.
 */
export function generateEventCashierCode(eventId: string) {
  return apiRequest<GenerateEventCashierCodeResponse>(`/event-cashiers/events/${eventId}/code`, {
    method: "POST",
  });
}
