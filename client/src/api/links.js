import { fetchWithTimeout, getApiBase, handleResponse } from "./client";
import { SORT_OPTIONS } from "../constants";

export async function createLink(targetUrl) {
  const res = await fetchWithTimeout(`${getApiBase()}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ link: { target_url: targetUrl } }),
  });
  return handleResponse(res);
}

export async function getLink(key) {
  const res = await fetchWithTimeout(
    `${getApiBase()}/links/${encodeURIComponent(key)}`,
    {
      headers: { Accept: "application/json" },
    },
  );
  return handleResponse(res);
}

export async function getMyLinks(page = 1, sort = SORT_OPTIONS.NEWEST) {
  const q = new URLSearchParams({ page: String(page) });
  if (sort && sort !== SORT_OPTIONS.NEWEST) q.set("sort", sort);
  const res = await fetchWithTimeout(`${getApiBase()}/links?${q}`, {
    headers: { Accept: "application/json" },
  });
  const data = await handleResponse(res);
  return {
    links: Array.isArray(data.links) ? data.links : [],
    total: typeof data.total === "number" ? data.total : 0,
  };
}

export async function getDashboardStats() {
  const res = await fetchWithTimeout(`${getApiBase()}/dashboard/stats`, {
    headers: { Accept: "application/json" },
  });
  const data = await handleResponse(res);
  return {
    totalLinks: typeof data.total_links === "number" ? data.total_links : 0,
    totalClicks: typeof data.total_clicks === "number" ? data.total_clicks : 0,
    topLocation: data.top_location != null ? String(data.top_location) : null,
  };
}

export async function getAnalytics(key) {
  const res = await fetchWithTimeout(
    `${getApiBase()}/links/${encodeURIComponent(key)}/analytics`,
    { headers: { Accept: "application/json" } },
  );
  return handleResponse(res);
}
