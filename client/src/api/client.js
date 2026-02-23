const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1"

export function getApiBase() {
  return API_BASE
}

export const defaultFetchOptions = { credentials: "include" }

export function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...defaultFetchOptions, ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  )
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized")
    this.name = "UnauthorizedError"
  }
}

function normalizeErrors(data) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors
  if (data?.error != null) return Array.isArray(data.error) ? data.error : [data.error]
  return ["Request failed"]
}

// Throws UnauthorizedError on 401 — callers (useApiCall) handle session invalidation in React.
export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) throw new UnauthorizedError()
    throw { status: res.status, errors: normalizeErrors(data) }
  }
  return data
}
