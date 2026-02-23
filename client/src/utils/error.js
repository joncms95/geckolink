export function formatApiError(err) {
  if (Array.isArray(err?.errors)) return err.errors.join(". ")
  return err?.errors || "Something went wrong"
}
