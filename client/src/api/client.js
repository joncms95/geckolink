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

export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || [data.error] || ["Request failed"] }
  return data
}
