/**
 * Called when the API returns 401 (e.g. session invalidated by login on another device).
 * App registers a handler that clears auth state and redirects to home.
 */
let handler = null

export function setOnSessionInvalidated(fn) {
  handler = fn
}

export function getOnSessionInvalidated() {
  return handler
}
