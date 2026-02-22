import { getApiBase, defaultFetchOptions, fetchWithTimeout, handleResponse } from "./client"

export async function createLink(url) {
  const res = await fetch(`${getApiBase()}/links`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ link: { url } }),
  })
  return handleResponse(res)
}

export async function getLink(shortCode) {
  const res = await fetch(`${getApiBase()}/links/${shortCode}`, {
    ...defaultFetchOptions,
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}

export async function getLinks(page = 1, perPage = 10, shortCodes = null) {
  const params = { page: String(page), per_page: String(perPage) }
  if (shortCodes?.length) params.short_codes = shortCodes.join(",")
  const q = new URLSearchParams(params)
  const res = await fetch(`${getApiBase()}/links?${q}`, {
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
  const url = `${getApiBase()}/links/${encodeURIComponent(shortCode)}/analytics`
  const res = await fetchWithTimeout(url, {
    ...defaultFetchOptions,
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}
