/**
 * Mirrors the shapes actually returned by the Pazimo backend
 * (backend/src/controllers/authController.js, organizerController.js).
 * Keep in sync with the backend rather than guessing new fields.
 */

// backend/src/models/User.js role enum, plus "usher" — which does not exist
// on the backend today (no role, no endpoints) but is included here so the
// app's route guards can be written against a real union member instead of
// an `as string` escape hatch. See README "Backend limitations". A separate
// Claude session is adding real usher support to the backend; this app's
// usher screens stay a placeholder until that contract is confirmed.
export type UserRole = "customer" | "organizer" | "venue" | "cinema" | "usher";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isPhoneVerified?: boolean;
}

export type OtpChannel = "sms" | "email";

/**
 * POST /api/auth/login now issues a mandatory second factor for organizers
 * (added 2026-09-04): the password step alone returns `requiresOtp: true`
 * with no token, and the client must complete sign-in via
 * POST /api/auth/organizer/verify-otp. Any other role gets a token
 * immediately, same as before.
 */
export type LoginResponse =
  | { status: "success"; requiresOtp?: false; data: { user: User; token: string } }
  | {
      status: "success";
      requiresOtp: true;
      data: { email: string; channel: OtpChannel; maskedDestination: string };
    };

export interface MeResponse {
  status: "success";
  data: User;
}

export interface OrganizerOtpSentResponse {
  status: "success";
  channel: OtpChannel;
  maskedDestination: string;
  message: string;
}

export interface OrganizerOtpVerifyResponse {
  status: "success";
  data: { user: User; token: string };
}

export interface PasswordResetCodeSentResponse {
  status: "success";
  channel: OtpChannel;
  maskedDestination: string;
  message: string;
}

export interface PasswordResetCodeVerifiedResponse {
  status: "success";
  message: string;
}

export interface PasswordResetCompleteResponse {
  status: "success";
  message: string;
  data: { user: User; token: string };
}

export interface ApiErrorBody {
  status?: "error";
  error?: boolean;
  message: string;
  code?: string;
}

/** Thrown by the API client for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly httpStatus: number | null;
  readonly code?: string;

  constructor(message: string, httpStatus: number | null, code?: string) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export interface SendOtpResponse {
  error: boolean;
  message: string;
}

export interface OrganizerSignUpInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  organization: string;
  organizerType?: string;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type Currency = "ETB" | "USD";

export interface TicketType {
  name: string;
  price?: number;
  priceETB?: number;
  priceUSD?: number;
  quantity: number;
}

/**
 * One event as returned inside GET /api/organizers/:organizerId/dashboard's
 * `data.events` array — already joined with its own ticket stats and
 * revenue server-side, not a plain Event document.
 */
export interface DashboardEvent {
  _id: string;
  title: string;
  description?: string;
  category?: { _id: string; name: string; description?: string };
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: { address?: string; city?: string; country?: string };
  coverImages?: string[];
  ticketTypes: TicketType[];
  status: EventStatus;
  capacity?: number;
  tags?: string[];
  ticketStats: { total: number; active: number; used: number };
  revenue: number;
  organizerRevenue: number;
  pazimoCommission: number;
}

export interface Withdrawal {
  _id: string;
  amount: number;
  currency: Currency;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

export interface OrganizerDashboardResponse {
  success: true;
  data: {
    events: DashboardEvent[];
    withdrawals: Withdrawal[];
    balance: {
      currency: Currency;
      totalRevenue: number;
      organizerRevenue: number;
      pazimoCommission: number;
      totalWithdrawn: number;
      pendingWithdrawals: number;
      availableBalance: number;
    };
    stats: {
      totalEvents: number;
      publishedEvents: number;
      draftEvents: number;
      completedEvents: number;
    };
  };
}

export interface OrganizerSignUpResponse {
  success: boolean;
  message: string;
  token?: string;
  organizer?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    organization: string;
    isActive: boolean;
    isPhoneVerified: boolean;
    registration: { _id: string; status: "pending" | "approved" | "rejected" };
  };
}

// --- Tickets & top customers (organizer "Tickets" tab) ----------------------
// backend/src/models/Ticket.js's status enum.
export type TicketStatus =
  | "active"
  | "used"
  | "cancelled"
  | "expired"
  | "pending"
  | "confirmed"
  | "declined";

/** One row of GET /api/tickets/organizer/all (backend/src/controllers/ticketController.js getOrganizerTickets). */
export interface OrganizerTicket {
  ticketId: string;
  event: { _id: string; title: string } | null;
  user: {
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  ticketType?: string;
  price: number;
  status: TicketStatus;
  paymentStatus?: string;
  purchaseDate?: string;
  createdAt: string;
  ticketCount?: number;
  purchaseQuantity?: number;
  isInvitation?: boolean;
  isOnDoor?: boolean;
}

export interface OrganizerTicketsResponse {
  success: true;
  tickets: OrganizerTicket[];
  count: number;
  totalCount: number;
  statistics: {
    totalRevenue: number;
    totalTickets: number;
    onDoorRevenue: number;
    onDoorTickets: number;
  };
  pagination: { currentPage: number; totalPages: number; hasMore: boolean };
}

/** One row of GET /api/organizers/:organizerId/top-customers. */
export interface TopCustomer {
  phone: string;
  name: string;
  totalTickets: number;
  totalSpent: number;
  eventsCount: number;
  lastActive: string | null;
}

export interface TopCustomersResponse {
  success: true;
  data: TopCustomer[];
}

/** One row of GET /api/tickets/event/:eventId's statistics.ticketTypeBreakdown. */
export interface TicketTypeBreakdownRow {
  ticketType: string;
  isOnDoor: boolean;
  pricePerTicket: number;
  totalSold: number;
  totalRevenue: number;
}

/**
 * GET /api/tickets/event/:eventId (backend/src/controllers/ticketController.js
 * getEventTickets) — the per-event drill-down: which ticket types sold, how
 * many, and how much they collected, plus the individual sale rows. Note:
 * unlike getOrganizerTickets, this endpoint has no top-level `success` field.
 */
export interface EventTicketsResponse {
  tickets: OrganizerTicket[];
  count: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  statistics: {
    totalRevenue: number;
    totalTickets: number;
    onDoorRevenue: number;
    onDoorTickets: number;
    onlineRevenue: number;
    onlineTickets: number;
    ticketTypeBreakdown: TicketTypeBreakdownRow[];
  };
}

// --- Beverages ("Bar" tab, organizer side) -----------------------------------

/** GET /api/beverages/organizer/eligibility — gates the rest of this surface. */
export interface BeverageEligibilityResponse {
  success: true;
  data: { eligibility: "eligible" | "pending" | "ineligible" | string };
}

/** GET /api/beverages/organizer/dashboard (backend/src/controllers/beverageSalesController.js buildDashboard). */
export interface BeverageDashboardTotals {
  revenue: number;
  units: number;
  orders: number;
  averageOrderValue: number;
  stockTotal: number;
  stockSold: number;
  stockRemaining: number;
  /** Percent, 0-100. null when nothing is listed (not the same as 0% sold). */
  sellThrough: number | null;
  potentialRevenue: number;
  eventsSelling: number;
  listings: number;
}

export interface BeverageByDrink {
  _id: string;
  name: string;
  color?: string;
  revenue: number;
  units: number;
  eventCount: number;
}

export interface BeverageByEvent {
  _id: string;
  title: string;
  startDate?: string;
  revenue: number;
  units: number;
  drinkCount: number;
}

export interface BeverageRecentSale {
  _id: string;
  event?: { _id: string; title: string };
  beverageName?: string;
  quantity: number;
  totalAmount: number;
  soldAt: string;
  status: string;
}

export interface BeverageDashboardResponse {
  success: true;
  data: {
    totals: BeverageDashboardTotals;
    byBeverage: BeverageByDrink[];
    byEvent: BeverageByEvent[];
    timeline: { date: string; revenue: number; units: number }[];
    recent: BeverageRecentSale[];
  };
}

// --- Cinema / "Cashier" ------------------------------------------------------

export interface CinemaProfile {
  _id: string;
  name: string;
  image?: string;
  isActive: boolean;
  beverageEligibility?: string;
  ticketCommissionRate?: number;
  beverageCommissionRate?: number;
  coversCinemaVat?: boolean;
}

export interface CinemaProfileResponse {
  success: true;
  data: CinemaProfile;
}

/** One revenue pool (tickets or beverages) inside a cinema's balance — backend/src/services/cinemaFinanceService.js buildStream. */
export interface CinemaBalanceStream {
  availableBalance: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  grossRevenue: number;
  cinemaRevenue: number;
  pazimoCommission: number;
  vatOnCommission: number;
  cinemaVat: number;
  pazimoCollected: number;
  seatsSold?: number;
  ticketCount?: number;
  unitsSold?: number;
  salesCount?: number;
}

/** GET /api/cinemas/me/finance — exact shape confirmed in cinemaFinanceService.calculateCinemaBalance. */
export interface CinemaFinanceResponse {
  success: true;
  data: {
    cinema: {
      _id: string;
      name: string;
      ticketCommissionRate?: number;
      beverageCommissionRate?: number;
      coversCinemaVat?: boolean;
    };
    currency: Currency;
    availableBalance: number;
    pendingWithdrawals: number;
    approvedWithdrawals: number;
    streams: { tickets: CinemaBalanceStream; beverages: CinemaBalanceStream };
    combined: {
      grossRevenue: number;
      cinemaRevenue: number;
      pazimoCommission: number;
      vatOnCommission: number;
      cinemaVat: number;
      pazimoCollected: number;
    };
  };
}

export interface CinemaTicketSaleSummary {
  totalRevenue: number;
  totalTickets: number;
  [key: string]: unknown;
}

export interface CinemaTicketSummaryResponse {
  success: true;
  data: CinemaTicketSaleSummary;
}

/** A box-office ticket sale row — field names beyond these are read defensively (see cashier tickets tab). */
export interface CinemaTicketSale {
  _id: string;
  ticketId?: string;
  movieTitle?: string;
  showtime?: string;
  seat?: string;
  price: number;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface CinemaTicketSalesResponse {
  success: true;
  data: CinemaTicketSale[];
  [key: string]: unknown;
}

export interface CinemaConcessionItem {
  _id: string;
  name: string;
  price: number;
  stockTotal?: number;
  sold?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CinemaConcessionsResponse {
  success: true;
  data: CinemaConcessionItem[];
}

export interface CinemaConcessionSalesSummary {
  revenue: number;
  units: number;
  orders: number;
  [key: string]: unknown;
}

export interface CinemaConcessionSalesSummaryResponse {
  success: true;
  data: CinemaConcessionSalesSummary;
}

// --- Usher --------------------------------------------------------------
// Confirmed against the real, already-shipped backend contract (added by a
// parallel session on ~/Documents/pazimo/backend, 2026-09-06): ushers are
// plain User documents (role "usher"), admin-created only (no self sign-up),
// and gain scan access to an event by redeeming a short code
// (EventUsherCode -> UsherEventAccess). An usher can hold access to more than
// one event at once, hence "my events" is a list, not a single record.

/** One live grant from GET /api/ushers/my-events. */
export interface UsherEventGrant {
  event: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: { address?: string; city?: string; country?: string };
    status: EventStatus;
    coverImages?: string[];
  };
  grantedAt: string;
}

export interface MyUsherEventsResponse {
  success: true;
  data: UsherEventGrant[];
}

/** POST /api/ushers/unlock-event { code } */
export interface UnlockEventResponse {
  success: true;
  data: { event: UsherEventGrant["event"]; grantedAt: string };
}

/**
 * The flat ticket summary POST /api/tickets/validate-qr returns — read
 * directly off `backend/src/controllers/ticketController.js`'s
 * `validateQRCode` (confirmed by reading it, not by description: it does
 * NOT nest a `ticket` object or return `remainingUses` — `userName` is
 * already resolved server-side from either the account or the guest name,
 * so the client never needs to pick between them).
 */
export interface ScannedTicketInfo {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: { address?: string; city?: string; country?: string };
  ticketType?: string;
  price: number;
  userName: string;
  userEmail?: string;
  purchaseDate?: string;
  status: TicketStatus;
  checkedIn: boolean;
  checkedInAt?: string;
  ticketCount?: number;
  /** Guest-invited (RSVP'd via an Invitation), not self-purchased — see confirmRSVP. */
  isInvitation?: boolean;
}

/**
 * POST /api/tickets/validate-qr's response. `alreadyCheckedIn` is only
 * present (and true) when the ticket was already checked in before this
 * scan. Every error case (not found, wrong event, already-inactive status)
 * comes back as plain `{ success: false, message }` at HTTP 400 — this
 * controller's catch-all forces 400 regardless of the underlying error's
 * real status, so don't branch on status code, just show `message`.
 *
 * Deliberately read-only — it does NOT check the ticket in (confirmed by
 * reading the controller: no `.save()` anywhere in it). It exists so the
 * scanner can show the usher who the ticket belongs to, which event, and
 * how many admits it's good for (`ticketCount`) *before* committing
 * anything — the usher picks how many people to admit right now (which may
 * be less than the full ticketCount, for a group arriving in parts) and
 * only then calls checkInTicket below.
 */
export interface ValidateQrResponse {
  success: true;
  alreadyCheckedIn?: boolean;
  message?: string;
  data: ScannedTicketInfo;
}

/**
 * PATCH /api/tickets/:ticketId/check-in { count, scopeEventId } — the
 * action that actually commits the check-in, `count` people at a time
 * (defaults to 1 server-side, but this app always sends the usher's chosen
 * count explicitly). Unlike validate-qr, `data.ticket` here is the raw,
 * unpopulated Ticket document (no eventTitle/userName) — the UI keeps
 * showing the info it already has from the validate step rather than
 * re-deriving anything from this response.
 */
export interface CheckInTicketResponse {
  success: true;
  alreadyCheckedIn?: boolean;
  message?: string;
  data: {
    ticket: { ticketId: string; ticketCount: number; checkedIn: boolean; status: TicketStatus };
    remainingUses: number;
    fullyUsed?: boolean;
  };
}
