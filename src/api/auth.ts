import { apiRequest } from "@/api/client";
import type {
  LoginResponse,
  MeResponse,
  OrganizerSignUpInput,
  OrganizerSignUpResponse,
  SendOtpResponse,
} from "@/types";

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
 * Backend: POST /api/auth/send-otp (backend/src/controllers/authController.js).
 * Triggers a real SMS via GeezSMS to `phoneNumber`. There is currently no
 * matching verify-otp endpoint — see README "Backend limitations". Do not
 * wire this up to compare against anything the response body returns; the
 * backend's own security review (docs/SECURITY_VULNERABILITIES.md #11)
 * flags trusting client-side OTP state as a known gap.
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
