import type { DashboardEvent, OrganizerTicket, TicketStatus } from "@/types";

/**
 * An organizer-issued invitation rather than a bought ticket. Legacy guest
 * checkouts were also stored with isInvitation: true but were paid for, so
 * price decides — the same rule the backend uses for its invitation counts.
 */
export function isInvitationTicket(ticket: Pick<OrganizerTicket, "isInvitation" | "price">) {
  return ticket.isInvitation === true && !(ticket.price > 0);
}

/**
 * Tickets actually bought for an event, invitations excluded. Falls back to
 * the old mixed `total` when talking to a backend that predates the split.
 */
export function ticketsSold(event: DashboardEvent) {
  return event.ticketStats.purchased ?? event.ticketStats.total;
}

export function invitationsIssued(event: DashboardEvent) {
  return event.ticketStats.invitations ?? 0;
}

/** Everyone who can get in the door — bought tickets plus invitations. */
export function admissionsIssued(event: DashboardEvent) {
  const { purchased, invitations, total } = event.ticketStats;
  return purchased !== undefined && invitations !== undefined ? purchased + invitations : total;
}

/**
 * What an invitation's raw ticket status means to the organizer. An
 * invitation starts "pending" until the guest RSVPs ("confirmed"); ones
 * issued straight from the invitations page start "active", which is just
 * as ready to scan, so both read as confirmed.
 */
export function invitationStatusLabel(status: TicketStatus) {
  switch (status) {
    case "pending":
      return "Awaiting RSVP";
    case "active":
    case "confirmed":
      return "Confirmed";
    case "used":
      return "Checked in";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    default:
      return "Cancelled";
  }
}

export type InvitationStatusGroup = "awaiting" | "confirmed" | "checkedIn" | "declined" | "cancelled";

const INVITATION_STATUS_GROUP: Record<TicketStatus, InvitationStatusGroup> = {
  pending: "awaiting",
  active: "confirmed",
  confirmed: "confirmed",
  used: "checkedIn",
  declined: "declined",
  cancelled: "cancelled",
  expired: "cancelled",
};

/** Folds the backend's per-status invitation counts into the groups the organizer sees. */
export function groupInvitationStatuses(breakdown: Partial<Record<TicketStatus, number>>) {
  const groups: Record<InvitationStatusGroup, number> = {
    awaiting: 0,
    confirmed: 0,
    checkedIn: 0,
    declined: 0,
    cancelled: 0,
  };
  for (const [status, count] of Object.entries(breakdown) as [TicketStatus, number][]) {
    const group = INVITATION_STATUS_GROUP[status];
    if (group) groups[group] += count;
  }
  return groups;
}
