/** Extracts error messages from an API response body into a string[]. */
export function normalizeErrors(data) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors
  return ["Request failed"]
}

/** Returns a single user-facing message from an API error thrown by handleResponse. */
export function formatApiError(err) {
  if (Array.isArray(err?.errors) && err.errors.length > 0) return err.errors.join(". ")
  if (typeof err?.message === "string") return err.message
  return "Something went wrong"
}
