import { getApiBase, fetchWithTimeout, handleResponse } from "./client"

export async function createLink(targetUrl) {
  const res = await fetchWithTimeout(`${getApiBase()}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ link: { target_url: targetUrl } }),
  })
  return handleResponse(res)
}

export async function getLink(key) {
  const res = await fetchWithTimeout(`${getApiBase()}/links/${encodeURIComponent(key)}`, {
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}

export async function getMyLinks(page = 1, perPage = 10) {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  const res = await fetchWithTimeout(`${getApiBase()}/me/links?${q}`, {
    headers: { Accept: "application/json" },
  })
  const data = await handleResponse(res)
  return {
    links: Array.isArray(data.links) ? data.links : [],
    total: typeof data.total === "number" ? data.total : 0,
  }
}

export async function getAnalytics(key) {
  const res = await fetchWithTimeout(
    `${getApiBase()}/links/${encodeURIComponent(key)}/analytics`,
    { headers: { Accept: "application/json" } }
  )
  return handleResponse(res)
}
