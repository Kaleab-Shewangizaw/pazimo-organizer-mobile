import { router, type Href } from "expo-router";

/**
 * router.back(), but falls back to replacing with `fallback` when there's
 * no history to pop — a bare router.back() on a cold-started or directly
 * deep-linked screen (a browser refresh on web; a restored/relaunched
 * native session) logs "The action 'GO_BACK' was not handled by any
 * navigator" and does nothing, leaving a dead back button.
 */
export function goBack(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
