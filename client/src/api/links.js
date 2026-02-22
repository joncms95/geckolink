const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1"

const defaultFetchOptions = { credentials: "include" }

function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...defaultFetchOptions, ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  )
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || [data.error] || ["Request failed"] }
  return data
}

export async function createLink(url) {
  const res = await fetch(`${API_BASE}/links`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ link: { url } }),
  })
  return handleResponse(res)
}

export async function getLink(shortCode) {
  const res = await fetch(`${API_BASE}/links/${shortCode}`, {
    ...defaultFetchOptions,
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}

export async function getLinks(page = 1, perPage = 10) {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  const res = await fetch(`${API_BASE}/links?${q}`, {
    ...defaultFetchOptions,
    headers: { Accept: "application/json" },
  })
  const data = await handleResponse(res)
  return {
    links: Array.isArray(data.links) ? data.links : [],
    total: typeof data.total === "number" ? data.total : 0,
  }
}

export async function getAnalytics(shortCode) {
  const url = `${API_BASE}/links/${encodeURIComponent(shortCode)}/analytics`
  const res = await fetchWithTimeout(url, {
    ...defaultFetchOptions,
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}
