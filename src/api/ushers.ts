import { apiRequest } from "@/api/client";
import type {
  EventUsherAccessResponse,
  GenerateEventUsherCodeResponse,
  MyUsherEventsResponse,
  UnlockEventResponse,
} from "@/types";

/**
 * Backend contract confirmed directly by the session that built it
 * (~/Documents/pazimo/backend, 2026-09-06) — ushers are admin-created User
 * accounts (role "usher") with no self sign-up; they gain scan access to an
 * event by redeeming a short code an admin/organizer generated for that
 * event. Access persists until explicitly revoked, and one usher can hold
 * grants for more than one event at once — hence a list, not a single
 * "my event".
 */

/** GET /api/ushers/my-events — every event this usher currently has access to. */
export function getMyUsherEvents() {
  return apiRequest<MyUsherEventsResponse>("/ushers/my-events");
}

/**
 * POST /api/ushers/unlock-event { code } — redeems a 6-character event code.
 * 404 "Invalid code" if it doesn't match anything; 400 if the event is
 * cancelled.
 */
export function unlockUsherEvent(code: string) {
  return apiRequest<UnlockEventResponse>("/ushers/unlock-event", {
    method: "POST",
    body: { code },
  });
}

/**
 * GET /api/ushers/events/:eventId/code — admin or the event's own organizer.
 * The event's current code (null if none generated yet) plus everyone who
 * currently holds a live grant from it.
 */
export function getEventUsherAccess(eventId: string) {
  return apiRequest<EventUsherAccessResponse>(`/ushers/events/${eventId}/code`);
}

/**
 * POST /api/ushers/events/:eventId/code — admin or the event's own
 * organizer. Generates a fresh code, overwriting whatever code existed
 * before. Existing grants (UsherEventAccess) are untouched — this only stops
 * the *old* code from working for a new redemption.
 */
export function generateEventUsherCode(eventId: string) {
  return apiRequest<GenerateEventUsherCodeResponse>(`/ushers/events/${eventId}/code`, {
    method: "POST",
  });
}
