const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1"

function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || [data.error] || ["Request failed"] }
  return data
}

export async function createLink(url) {
  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ link: { url } }),
  })
  return handleResponse(res)
}

export async function getLink(shortCode) {
  const res = await fetch(`${API_BASE}/links/${shortCode}`, {
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}

export async function getAnalytics(shortCode) {
  const url = `${API_BASE}/links/${encodeURIComponent(shortCode)}/analytics`
  const res = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}
