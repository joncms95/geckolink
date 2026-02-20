const API_BASE = "/api/v1"

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
  const res = await fetch(`${API_BASE}/links/${shortCode}/analytics`, {
    headers: { Accept: "application/json" },
  })
  return handleResponse(res)
}
