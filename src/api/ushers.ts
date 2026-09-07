import { apiRequest } from "@/api/client";
import type { MyUsherEventsResponse, UnlockEventResponse } from "@/types";

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
