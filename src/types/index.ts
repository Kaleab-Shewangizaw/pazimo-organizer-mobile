/**
 * Mirrors the shapes actually returned by the Pazimo backend
 * (backend/src/controllers/authController.js, organizerController.js).
 * Keep in sync with the backend rather than guessing new fields.
 */

// backend/src/models/User.js role enum. "usher" does not exist on the
// backend today — see README "Backend limitations".
export type UserRole = "customer" | "organizer" | "venue" | "cinema";

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
