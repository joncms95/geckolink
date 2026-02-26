/** Response body (parsed JSON) → one user-facing message string. */
export function getMessageFromBody(data) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(". ");
  }
  return "Request failed";
}

/** Any error from an API call (handleResponse throw or fetch Error) → one string for UI. */
export function formatApiError(err) {
  if (typeof err?.message === "string" && err.message) return err.message;
  return "Something went wrong";
}
