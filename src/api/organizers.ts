import { File } from "expo-file-system";

import { apiRequest } from "@/api/client";
import type {
  Currency,
  OrganizerDashboardResponse,
  OrganizerProfileResponse,
  TopCustomersResponse,
  UpdatePasswordResponse,
} from "@/types";

/**
 * Backend: GET /api/organizers/:organizerId/dashboard
 * (backend/src/controllers/organizerController.js). One aggregation call
 * that returns the organizer's events already joined with per-event ticket
 * stats and revenue, plus a balance summary and recent withdrawals — this
 * is the only call the organizer home screen needs.
 */
export function getOrganizerDashboard(organizerId: string, currency: Currency = "ETB") {
  return apiRequest<OrganizerDashboardResponse>(
    `/organizers/${organizerId}/dashboard?currency=${currency}`,
  );
}

/**
 * Backend: GET /api/organizers/:organizerId/top-customers
 * (backend/src/controllers/organizerController.js getTopCustomers). Ranks by
 * ticket count across every event this organizer runs — used by the
 * Tickets tab's "Top customers" section.
 */
export function getTopCustomers(organizerId: string, limit = 10) {
  return apiRequest<TopCustomersResponse>(
    `/organizers/${organizerId}/top-customers?limit=${limit}`,
  );
}

/**
 * Backend: GET /api/organizers/profile (organizerController.getProfile).
 * Not used to populate the auth store (that's /auth/me, which returns the
 * plain User document) — only the edit-profile screen calls this, since
 * `organization` lives on the separate OrganizerRegistration doc and is
 * joined in here but not on /auth/me.
 */
export function getOrganizerProfile() {
  return apiRequest<OrganizerProfileResponse>("/organizers/profile");
}

export interface UpdateOrganizerProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organization: string;
}

/**
 * Backend: PUT /api/organizers/profile (organizerController.updateProfile).
 * Rejects with a 400 ApiError if the email/phone is already taken by
 * another account — same uniqueness check sign-up runs.
 */
export function updateOrganizerProfile(input: UpdateOrganizerProfileInput) {
  return apiRequest<OrganizerProfileResponse>("/organizers/profile", {
    method: "PUT",
    body: { ...input },
  });
}

/**
 * Backend: PUT /api/organizers/profile/picture (organizerController.
 * updateProfilePicture), guarded by `upload.single("profilePicture")`
 * (multer) — must be sent as FormData, never JSON. `uri` is a local file URI
 * from expo-image-picker.
 *
 * With the New Architecture enabled, Expo SDK 57's global `fetch`/`FormData`
 * are the new WinterCG-compliant implementation (see expo/fetch) — it treats
 * a plain `{ uri, name, type }` object as a normal value and stringifies it
 * to "[object Object]" instead of recognizing it as a file part (the classic
 * React Native FormData pattern no longer works here). `expo-file-system`'s
 * `File` class implements the real `Blob` interface, so it appends as an
 * actual file part multer can read into `req.file`.
 */
export function updateOrganizerProfilePicture(uri: string) {
  const file = new File(uri);

  const form = new FormData();
  form.append("profilePicture", file, file.name);

  return apiRequest<OrganizerProfileResponse>("/organizers/profile/picture", {
    method: "PUT",
    body: form,
  });
}

export interface UpdateOrganizerPasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Backend: PUT /api/organizers/security (organizerController.updatePassword).
 * Rejects with a 400 ApiError if currentPassword is wrong or newPassword
 * matches the current one.
 */
export function updateOrganizerPassword(input: UpdateOrganizerPasswordInput) {
  return apiRequest<UpdatePasswordResponse>("/organizers/security", {
    method: "PUT",
    body: { ...input },
  });
}
