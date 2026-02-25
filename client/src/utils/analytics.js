/** Normalizes analytics report from API to a single shape. API returns snake_case. */
export function normalizeAnalyticsReport(data) {
  if (!data || typeof data !== "object") return null
  const byCountry = data.by_country ?? {}
  const topFromApi = data.top_location
  const topLocation =
    topFromApi?.trim() ? topFromApi.trim() : getTopCountry(byCountry)
  return {
    by_country: byCountry,
    by_hour: data.by_hour ?? {},
    clicks: Array.isArray(data.clicks) ? data.clicks : [],
    clicks_count: data.clicks_count ?? 0,
    top_location: topLocation,
  }
}

export function formatTimestamp(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-GB")
}

export function clickGeolocation(v) {
  if (v?.geolocation?.trim()) return v.geolocation.trim()
  if (v?.country?.trim()) return v.country.trim()
  return "—"
}

function getTopCountry(byCountry) {
  if (!byCountry || Object.keys(byCountry).length === 0) return "N/A"
  return Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0][0]
}
