import { config } from "@/lib/config";
import { getStoredToken } from "@/lib/secureStorage";
import { ApiError } from "@/types";

type Json = Record<string, unknown>;

/**
 * Called whenever a request comes back 401. The auth store subscribes here
 * (see src/store/authStore.ts) so an expired/invalid token clears session
 * state everywhere, not just in the screen that happened to make the call.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Backend returned something that isn't JSON (an HTML error page, a
    // proxy timeout page, etc.) — never show that raw text to a user.
    return null;
  }
}

function messageFromBody(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const maybeMessage = (body as Record<string, unknown>).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }
  switch (status) {
    case 400:
      return "That request wasn't valid. Check the form and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "That couldn't be found.";
    case 409:
      return "That conflicts with something that already happened.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong on our end. Please try again.";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Json | FormData;
  auth?: boolean; // attach the stored bearer token, default true
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to reach Pazimo. Check your internet connection and try again.",
      null,
    );
  }

  const parsed = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
    const body = parsed as { code?: string } | null;
    throw new ApiError(
      messageFromBody(parsed, response.status),
      response.status,
      body?.code,
    );
  }

  return parsed as T;
}
