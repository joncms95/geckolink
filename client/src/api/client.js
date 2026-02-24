const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1"

export function getApiBase() {
  return API_BASE
}

export const TOKEN_KEY = "geckolink_token"

function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

export const defaultFetchOptions = {}

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  const headers = { ...authHeaders(), ...options.headers }
  return fetch(url, { ...defaultFetchOptions, ...options, headers, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  )
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized")
    this.name = "UnauthorizedError"
  }
}

function normalizeErrors(data, status) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors
  if (data?.error != null) return Array.isArray(data.error) ? data.error : [data.error]
  if (status === 403) return ["You don't have permission to access this resource."]
  if (status === 404) return ["Not found."]
  return ["Request failed"]
}

// Throws UnauthorizedError on 401.
export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) throw new UnauthorizedError()
    throw { status: res.status, errors: normalizeErrors(data, res.status) }
  }
  return data
}
