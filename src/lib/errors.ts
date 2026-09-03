import { ApiError } from "@/types";

/** Internal sentinel thrown by screens to short-circuit a mutation after
 * setting field-level errors — never shown as a banner itself. */
export const VALIDATION_ERROR_MESSAGE = "VALIDATION";

/**
 * Message for a top-level error banner, given a TanStack Query mutation's
 * `error`. Returns null when there's nothing to show (no error, or a local
 * validation short-circuit already surfaced as field errors) — otherwise
 * always returns *something*, even for an error type we didn't anticipate
 * (e.g. a SecureStore failure), instead of failing silently with no
 * feedback while a submit button sits there having stopped loading.
 */
export function bannerMessageFor(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message === VALIDATION_ERROR_MESSAGE) {
    return null;
  }
  return "Something went wrong. Please try again.";
}
