import { apiRequest } from "@/api/client";
import type {
  CheckInTicketResponse,
  EventTicketsResponse,
  OrganizerTicketsResponse,
  ValidateQrResponse,
} from "@/types";

/**
 * Backend: GET /api/tickets/organizer/all
 * (backend/src/controllers/ticketController.js getOrganizerTickets). Paginated
 * list of every ticket sold across the organizer's own events, plus
 * aggregate statistics for the header.
 */
export function getOrganizerTickets(page = 1, limit = 30) {
  return apiRequest<OrganizerTicketsResponse>(
    `/tickets/organizer/all?page=${page}&limit=${limit}`,
  );
}

/**
 * Backend: GET /api/tickets/event/:eventId
 * (backend/src/controllers/ticketController.js getEventTickets). The
 * organizer Tickets tab is event-first — pick an event, then see which
 * ticket types it sold, how many, and how much they collected (this is
 * the same data the web app's organizer/customers page shows, keyed the
 * same way).
 */
export function getEventTickets(eventId: string, page = 1, limit = 100) {
  return apiRequest<EventTicketsResponse>(
    `/tickets/event/${eventId}?page=${page}&limit=${limit}`,
  );
}

/**
 * Backend: POST /api/tickets/validate-qr. Used by the usher scanner —
 * `qrData` is whatever raw string the camera decoded (ticket QR codes are a
 * bare ticketId, no JSON envelope), `scopeEventId` is the event the usher is
 * currently scanning for (their access is checked against this event,
 * not just against holding *some* grant). See `src/api/ushers.ts` for how
 * that event is chosen.
 */
export function validateTicketQr(qrData: string, scopeEventId: string) {
  return apiRequest<ValidateQrResponse>("/tickets/validate-qr", {
    method: "POST",
    body: { qrData, scopeEventId },
  });
}

/**
 * Backend: PATCH /api/tickets/:ticketId/check-in. The action step after
 * validateTicketQr's read-only preview — admits `count` people against this
 * ticket's remaining uses. Only call this once the usher has confirmed who
 * they're admitting and how many.
 */
export function checkInTicket(ticketId: string, count: number, scopeEventId: string) {
  return apiRequest<CheckInTicketResponse>(`/tickets/${ticketId}/check-in`, {
    method: "PATCH",
    body: { count, scopeEventId },
  });
}
