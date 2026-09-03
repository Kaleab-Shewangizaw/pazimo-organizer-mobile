import { apiRequest } from "@/api/client";
import type {
  LoginResponse,
  MeResponse,
  OrganizerOtpSentResponse,
  OrganizerOtpVerifyResponse,
  OrganizerSignUpInput,
  OrganizerSignUpResponse,
  OtpChannel,
  PasswordResetCodeSentResponse,
  PasswordResetCodeVerifiedResponse,
  PasswordResetCompleteResponse,
  SendOtpResponse,
} from "@/types";

/**
 * POST /api/auth/login. For an organizer account this returns
 * `requiresOtp: true` with no token — the caller must follow up with
 * verifyOrganizerOtp(email, code) using the email echoed back here.
 */
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function getCurrentUser() {
  return apiRequest<MeResponse>("/auth/me");
}

/**
 * POST /api/auth/organizer/send-otp — the standalone "sign in with a code"
 * path (no password). Looks the organizer up by email; 404s if there's no
 * active organizer at that email, same as a login failure would.
 */
export function organizerSendOtp(email: string, channel: OtpChannel = "sms") {
  return apiRequest<OrganizerOtpSentResponse>("/auth/organizer/send-otp", {
    method: "POST",
    body: { email, channel },
    auth: false,
  });
}

/**
 * POST /api/auth/organizer/verify-otp — completes both the mandatory
 * post-password 2FA step from login() and the standalone code-only sign-in
 * from organizerSendOtp(). Code is single-use, expires after 10 minutes,
 * and the account is capped at 5 wrong attempts before it must be resent.
 */
export function verifyOrganizerOtp(email: string, code: string) {
  return apiRequest<OrganizerOtpVerifyResponse>("/auth/organizer/verify-otp", {
    method: "POST",
    body: { email, code },
    auth: false,
  });
}

/**
 * POST /api/auth/organizer/forgot-password. `identifier` is an email or
 * phone number (backend's findUserByIdentifier tells them apart). Same
 * "account not found" messaging as a failed login, and the same channel
 * choice as organizerSendOtp — SMS by default, email on request.
 */
export function organizerForgotPassword(identifier: string, channel: OtpChannel = "sms") {
  return apiRequest<PasswordResetCodeSentResponse>("/auth/organizer/forgot-password", {
    method: "POST",
    body: { identifier, channel },
    auth: false,
  });
}

/**
 * POST /api/auth/organizer/verify-reset-code — checks the code without
 * spending it, so the UI can move from "enter code" to "set new password"
 * before the code is actually consumed by organizerResetPassword.
 */
export function organizerVerifyResetCode(identifier: string, code: string) {
  return apiRequest<PasswordResetCodeVerifiedResponse>("/auth/organizer/verify-reset-code", {
    method: "POST",
    body: { identifier, code },
    auth: false,
  });
}

/**
 * POST /api/auth/organizer/reset-password — re-checks the code (single use,
 * cleared on success) and sets the new password. Signs the organizer in
 * immediately, same as the old email-link reset used to.
 */
export function organizerResetPassword(identifier: string, code: string, newPassword: string) {
  return apiRequest<PasswordResetCompleteResponse>("/auth/organizer/reset-password", {
    method: "POST",
    body: { identifier, code, newPassword },
    auth: false,
  });
}

/**
 * Backend: POST /api/auth/send-otp (backend/src/controllers/authController.js).
 * Triggers a real SMS via GeezSMS to `phoneNumber`. This is a *different*
 * mechanism from organizerSendOtp/verifyOrganizerOtp above — it has no
 * matching verify endpoint and isn't wired into organizer sign-up, so it's
 * still UI-only there. See README "Backend limitations".
 */
export function sendOtp(phoneNumber: string) {
  return apiRequest<SendOtpResponse>("/auth/send-otp", {
    method: "POST",
    body: { phoneNumber },
    auth: false,
  });
}

/**
 * Backend: POST /api/organizers/sign-up (backend/src/controllers/organizerController.js).
 * Creates the user with isActive: false — an admin must approve the
 * registration before the organizer can log in.
 *
 * The route runs through `upload.single("businessLicense")` (multer), which
 * only parses `multipart/form-data` — a JSON body would arrive with an empty
 * req.body server-side even though this app never uploads a file today, so
 * this must be sent as FormData.
 */
export function organizerSignUp(input: OrganizerSignUpInput) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("email", input.email);
  form.append("phone", input.phone);
  form.append("password", input.password);
  form.append("organization", input.organization);
  if (input.organizerType) form.append("organizerType", input.organizerType);

  return apiRequest<OrganizerSignUpResponse>("/organizers/sign-up", {
    method: "POST",
    body: form,
    auth: false,
  });
}
