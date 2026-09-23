/**
 * Mirrors the shapes actually returned by the Pazimo backend
 * (backend/src/controllers/authController.js, organizerController.js).
 * Keep in sync with the backend rather than guessing new fields.
 */

// backend/src/models/User.js role enum. "usher" and "cashier" are both real,
// live roles now (see that file's own comment on the enum) — a usher is
// scoped to one event at a time via a redeemed EventUsherCode, while a
// cashier is scoped permanently to exactly one cinema or venue via the
// `cinema`/`venue` field below.
export type UserRole = "customer" | "organizer" | "venue" | "cinema" | "usher" | "cashier";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isPhoneVerified?: boolean;
  /** Relative path from the backend's /uploads static mount (e.g. "/uploads/foo.jpg"), or null. Resolve via resolveMediaUrl (src/lib/media.ts) before rendering. */
  profilePicture?: string | null;
  /** Organizer-only — lives on the OrganizerRegistration doc from sign-up, joined in by the /organizers/profile endpoints. null for every other role. */
  organization?: string | null;
  /**
   * Only ever set for role "cashier" — exactly one of `cinema`/`venue` is the
   * id of the single business this login is scoped to (see authController.js
   * login()'s comment). The app reads this to decide which counter surface
   * (cinema ticket/concession scanner vs. venue drink scanner) to show, and
   * which /api/cinemas/me/* or /api/venues/:venueId/* base to call.
   */
  cinema?: string | null;
  venue?: string | null;
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

/**
 * Backend: GET/PUT /api/organizers/profile and PUT /api/organizers/profile/picture
 * (backend/src/controllers/organizerController.js) — unlike the auth
 * endpoints above, organizerController's own envelope is `{ success, data }`
 * rather than `{ status, data }`.
 */
export interface OrganizerProfileResponse {
  success: true;
  data: User;
}

/** Backend: PUT /api/organizers/security (organizerController.updatePassword). */
export interface UpdatePasswordResponse {
  success: true;
  message: string;
}

/**
 * PUT /api/auth/update-password (authController.updatePassword) — the
 * generic, role-agnostic twin of updateOrganizerPassword's
 * `/organizers/security`. Same fields, different envelope key (`status`,
 * not `success`) since it's a different handler.
 */
export interface AuthUpdatePasswordResponse {
  status: "success";
  message: string;
}

/**
 * Backend: notificationPreferences on the User model (backend/src/models/User.js).
 * Stored for every role, not organizer-specific — GET/PUT
 * /api/auth/notification-preferences (authController.js) works for any
 * authenticated account. Delivery isn't gated on these yet (see that
 * controller's own comment); they're just persisted for now.
 */
export interface NotificationPreferences {
  ticketUpdates: boolean;
  chatMessages: boolean;
  promotions: boolean;
}

export interface NotificationPreferencesResponse {
  status: "success";
  data: NotificationPreferences;
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

/**
 * GET /api/beverages/organizer/catalog — the organizer's sellable drinks,
 * with images. The revenue-dashboard rows above (BeverageByDrink) don't
 * carry an image themselves; the Bar tab cross-references this by `_id`
 * (BeverageByDrink._id is the same Beverage id) to show one.
 */
export interface BeverageCatalogItem {
  _id: string;
  name: string;
  image?: string | null;
  color?: string | null;
}

export interface BeverageCatalogResponse {
  success: true;
  data: BeverageCatalogItem[];
}

// --- Happy hour -----------------------------------------------------------
// backend/src/models/HappyHour.js + utils/happyHour.js, confirmed by reading
// both directly (~/Documents/pazimo/backend, 2026-09-12). A campaign's
// status is never stored — it's derived from wall-clock time on every read,
// so the same shape comes back from listing an event's campaigns and from
// the happy-hour status attached to each line-up row below.

/** Derived from HappyHour + Date.now() — see utils/happyHour.js getCampaignState. */
export type HappyHourState =
  | { status: "none" }
  | { status: "cancelled" }
  | { status: "scheduled"; startsAt: string | null; price?: number; happyHourId?: string }
  | { status: "active"; startsAt: string; endsAt: string; price?: number; happyHourId?: string }
  | { status: "ended"; endedAt: string };

/** One row of GET /api/beverages/organizer/events/:eventId/beverages — this event's drink line-up. */
export interface EventBeverageRow {
  _id: string;
  event: string;
  organizer: string;
  beverage: { _id: string; name: string; image?: string | null; color?: string | null; isActive: boolean } | null;
  price: number;
  currency: "ETB";
  stockTotal: number;
  sold: number;
  remaining: number;
  isAvailable: boolean;
  happyHourStatus: HappyHourState;
  unavailableReason: "removed" | "inactive" | "blocked" | null;
  createdAt: string;
}

export interface EventBeverageLineupResponse {
  success: true;
  data: EventBeverageRow[];
  event: { _id: string; title: string; startDate: string; status: EventStatus };
  organizerEligibility: string;
}

/** One drink inside a happy-hour campaign — `beverage`/`regularPrice` are only populated by listEventHappyHours. */
export interface HappyHourItem {
  lineup: string;
  price: number;
  beverage?: { _id: string; name: string; color?: string | null } | null;
  regularPrice?: number | null;
}

/** A happy-hour campaign (backend/src/models/HappyHour.js). */
export interface HappyHourCampaign {
  _id: string;
  scope: "EVENT" | "VENUE";
  event?: string;
  organizer?: string;
  items: HappyHourItem[];
  durationMinutes: number;
  startMode: "manual" | "scheduled";
  scheduledStartAt?: string | null;
  startedAt?: string | null;
  cancelledAt?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  /** Only present on listEventHappyHours' response — derived, not stored. */
  state?: HappyHourState;
}

export interface HappyHourListResponse {
  success: true;
  data: HappyHourCampaign[];
}

export interface HappyHourMutationResponse {
  success: true;
  data: HappyHourCampaign;
}

/**
 * One row of GET /api/beverages/organizer/sales (beverageSalesController.js
 * listSales) — the raw ledger, unlike the byBeverage/byEvent aggregates.
 * Carries no reference back to a happy hour (BeverageSale.recordSale only
 * ever saves the already-discounted unitPrice — see
 * beverageSalesService.js) — matching one to a campaign means cross-
 * referencing `eventBeverage` + `soldAt` against the campaign's own window
 * client-side.
 */
export interface OrganizerBeverageSaleRow {
  _id: string;
  /** Human-facing tracking number, e.g. "PZB-SL-000042" — what a customer shows at the counter to collect an online order (see backend/src/models/BeverageSale.js). */
  referenceNumber?: string;
  event: { _id: string; title: string } | null;
  eventBeverage: string;
  beverageName: string;
  beverageColor?: string | null;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  currency: string;
  soldAt: string;
  status: "confirmed" | "refunded";
  /** "online" = a customer's own pre-paid order, collected later — the only kind that can be redeemed. "manual" was rung up and handed over on the spot. */
  channel: "online" | "manual";
  redeemedAt?: string | null;
}

export interface OrganizerBeverageSalesResponse {
  success: true;
  data: OrganizerBeverageSaleRow[];
  pagination: { total: number; page: number; pages: number };
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

// --- Cinema door/counter scanner ---------------------------------------
// backend/src/controllers/cinemaTicketController.js (getStaffTicket,
// getStaffOrder, checkIn, checkInOrder) and cinemaBeverageController.js
// (listOutstandingForOrder, redeemSale) — mirrors the already-shipped web
// dashboard's components/cinema/cinema-scanner.tsx exactly, same endpoints
// and response shapes.

export interface CinemaStaffTicketSeat {
  row?: string;
  number?: string;
  /** "A-12" — the identity to send back in `seatKeys` when admitting by seat. */
  seatKey?: string;
  categoryLabel?: string;
  /** Set once this specific seat has been admitted; null/absent while outstanding. */
  admittedAt?: string | null;
}

/** One CinemaTicket row, as the staff-facing lookup returns it — one seat/tier
 * per document, so a multi-tier order comes back as several of these. */
export interface CinemaStaffTicket {
  _id?: string;
  ticketId: string;
  movieTitle: string;
  hallName?: string;
  ticketType: string;
  quantity: number;
  /** Empty/absent on an unassigned-seating hall, where a ticket admits to the room and not to a chair. */
  seats?: CinemaStaffTicketSeat[] | null;
  checkedIn: boolean;
  checkedAt?: string | null;
  status: string;
  paymentStatus: string;
  paymentReference?: string;
  /** Populated by getStaffTicket/getStaffOrder (endsAt is what `isExpired`, on
   * the response envelope below, is computed from — the screening's actual
   * runtime, not just its start). Absent only if the showtime itself was
   * deleted out from under an existing ticket. */
  showtime?: { _id?: string; startsAt: string; endsAt: string } | null;
}

/** A pre-bought concession this order has not collected yet. */
export interface CinemaOutstandingConcessionItem {
  _id: string;
  referenceNumber?: string;
  beverageName: string;
  beverageCategory?: string;
  quantity: number;
  unitPrice?: number;
  totalAmount: number;
  soldAt?: string;
}

export interface CinemaStaffTicketResponse {
  success: true;
  data: CinemaStaffTicket;
  /** Whether `now` is past the screening's `showtime.endsAt` — computed
   * server-side (the same gate checkIn/checkInOrder enforce) so the scanner
   * can show "Expired" before staff ever taps Mark as used. */
  isExpired: boolean;
  /** Whether `now` is more than EARLY_ADMISSION_MINUTES before
   * `showtime.startsAt` — the other half of the same door: doors aren't
   * open yet, so nothing can be admitted. Mutually exclusive with
   * `isExpired`; neither set means the screening is on now. */
  isTooEarly: boolean;
  outstandingConcessions: CinemaOutstandingConcessionItem[];
}

export interface CinemaStaffOrderResponse {
  success: true;
  data: CinemaStaffTicket[];
  isExpired: boolean;
  isTooEarly: boolean;
  outstandingConcessions: CinemaOutstandingConcessionItem[];
}

export interface CinemaCheckInTicketResponse {
  success: true;
  data: CinemaStaffTicket;
  admittedSeats: string[];
  fullyAdmitted: boolean;
  outstandingConcessions: CinemaOutstandingConcessionItem[];
}

export interface CinemaCheckInOrderResponse {
  success: true;
  data: { tickets: CinemaStaffTicket[]; admittedCount: number };
  outstandingConcessions: CinemaOutstandingConcessionItem[];
}

export interface CinemaRedeemConcessionResponse {
  success: true;
  data: CinemaOutstandingConcessionItem & { redeemedAt: string };
}

// --- Venue counter (bar cashiers) ----------------------------------------
// backend/src/controllers/venueSalesController.js (getOutstandingVenueOrder,
// redeemSale) — a venue sells only drinks (no seats/tickets), so its counter
// contract is the simple half of the cinema one above: one code (a plain
// CODE128 barcode over the bare payment reference — see
// backend/src/utils/barcodeRenderer.js — not a JSON QR payload like the
// cinema's), one kind of item, no picker. Mirrors the already-shipped web
// dashboard's components/venue/venue-scanner.tsx exactly.

export interface VenueOutstandingItem {
  _id: string;
  referenceNumber?: string;
  beverageName: string;
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  soldAt?: string;
}

export interface VenueOutstandingOrderResponse {
  success: true;
  data: VenueOutstandingItem[];
}

export interface VenueRedeemSaleResponse {
  success: true;
  data: VenueOutstandingItem & { redeemedAt: string };
}

/**
 * GET /api/cinemas/me/context (cinemaController.getCashierContext) — just
 * enough identity for a cashier's own account screen to show which cinema
 * it's working at. GET /me is owner-only, so a cashier can't read the full
 * profile this comes from.
 */
export interface CinemaCashierContextResponse {
  success: true;
  data: { _id: string; name: string; beverageEligibility: string };
}

/**
 * GET /api/venues/:venueId/beverages (venueController.listVenueBeverages) —
 * a cashier can't reach GET /venues/me (owner-only), so this reuses the
 * already cashier-safe beverages endpoint purely for the `venue` identity it
 * happens to carry alongside the line-up (mirrors the web dashboard's
 * fetchVenueIdentityForCashier). The line-up itself isn't modeled here since
 * nothing on the mobile app reads it (yet).
 */
export interface VenueIdentityResponse {
  success: true;
  data: unknown[];
  venue: { _id: string; name: string; venueType: string; isActive: boolean };
  venueEligibility: string;
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

/** One usher currently holding a live grant, as returned alongside the code below. */
export interface EventUsherAccessGrant {
  accessId: string;
  usher: { _id: string; firstName: string; lastName: string; email: string; phoneNumber: string };
  grantedAt: string;
}

/** GET /api/ushers/events/:eventId/code */
export interface EventUsherAccessResponse {
  status: "success";
  data: {
    code: string | null;
    codeUpdatedAt: string | null;
    ushers: EventUsherAccessGrant[];
  };
}

/** POST /api/ushers/events/:eventId/code — (re)generates the event's code. */
export interface GenerateEventUsherCodeResponse {
  status: "success";
  data: { code: string };
}

/** PATCH /api/ushers/events/:eventId/access/:usherId/revoke */
export interface RevokeUsherAccessResponse {
  status: "success";
  data: { accessId: string; revokedAt: string };
}

export interface UsherSignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

/**
 * POST /api/ushers/sign-up — public, no auth. Same success envelope as a
 * password login (no requiresOtp branch: ushers never get the organizer 2FA
 * step), so the client can sign the person in immediately after sign-up.
 */
export type UsherSignUpResponse = Extract<LoginResponse, { requiresOtp?: false }>;

// --- Event cashiers -------------------------------------------------------
// The event-scoped twin of ushers above (backend/src/controllers/
// eventCashierController.js, added alongside removing an organizer's own
// direct beverage-redemption power — an organizer runs the event, it
// doesn't work the bar). Same code -> per-event-grant shape as ushers, just
// for handing over beverages instead of scanning tickets. Unlike ushers,
// account creation is admin OR the event's own organizer.

/** One live grant from GET /api/event-cashiers/my-events. */
export interface CashierEventGrant {
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

export interface MyCashierEventsResponse {
  status: "success";
  data: CashierEventGrant[];
}

/** POST /api/event-cashiers/unlock-event { code } */
export interface UnlockCashierEventResponse {
  status: "success";
  data: { event: CashierEventGrant["event"]; grantedAt: string };
}

/** One cashier currently holding a live grant, as returned alongside the code below. */
export interface EventCashierAccessGrant {
  accessId: string;
  cashier: { firstName: string; lastName: string; email: string; phoneNumber: string };
  grantedAt: string;
}

/** GET /api/event-cashiers/events/:eventId/code */
export interface EventCashierAccessResponse {
  status: "success";
  data: {
    code: string | null;
    codeUpdatedAt: string | null;
    cashiers: EventCashierAccessGrant[];
  };
}

/** POST /api/event-cashiers/events/:eventId/code — (re)generates the event's code. */
export interface GenerateEventCashierCodeResponse {
  status: "success";
  data: { code: string };
}

// --- Event beverage door/counter scanner ----------------------------------
// backend/src/controllers/beverageSalesController.js (getOutstandingByReference,
// redeemBeverageSale) — the event-side twin of the cinema and venue counter
// scanners above. A door has only the barcode it just scanned, not the
// buyer's account, so this is looked up by BeverageSale.referenceNumber
// (e.g. "EV-7K2QXM", printed as a literal barcode, not a JSON QR payload —
// see backend/src/utils/barcodeRenderer.js) rather than by customer.

export interface EventOutstandingBeverageItem {
  _id: string;
  referenceNumber?: string;
  beverageName: string;
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  soldAt?: string;
}

export interface EventOutstandingBeverageResponse {
  success: true;
  data: EventOutstandingBeverageItem[];
  /** Whether `now` is past the event's end plus the 12-hour grace window —
   * computed server-side (the same gate redeemBeverageSale enforces) so the
   * scanner can show "Expired" before staff ever tap Hand over. */
  isExpired: boolean;
}

export interface RedeemEventBeverageResponse {
  success: true;
  data: EventOutstandingBeverageItem & { redeemedAt: string };
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
