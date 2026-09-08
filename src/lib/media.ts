import { config } from "@/lib/config";

// The backend seeds every event with this literal string when no cover was
// uploaded (see backend/src/models/Event.js's coverImages default) — it
// isn't a real, servable file, so treat it as "no image" rather than
// trying to load it.
const NO_COVER_PLACEHOLDER = "default-event.jpg";

/**
 * Event cover images come back from the API as a path relative to the
 * backend's static /uploads mount (e.g. "/uploads/foo.jpg") — never
 * relative to the API's own /api prefix, and occasionally already an
 * absolute URL. Resolve either shape to something <Image> can load, or
 * undefined when there's no real image to show.
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path || path === NO_COVER_PLACEHOLDER) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.mediaOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
}
