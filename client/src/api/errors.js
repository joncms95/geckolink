/**
 * Error thrown by handleResponse for non-ok API responses.
 * Preserves stack trace and provides status for callers (e.g. 404 checks).
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Response body (parsed JSON) → one user-facing message string. */
export function getMessageFromBody(data) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(". ");
  }
  return "Request failed";
}

/** Any error from an API call (ApiError or fetch Error) → one string for UI. */
export function formatApiError(err) {
  if (typeof err?.message === "string" && err.message) return err.message;
  return "Something went wrong";
}
