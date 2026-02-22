export function normalizeUrl(input) {
  const trimmed = input.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function hasValidHost(urlString) {
  try {
    const url = new URL(urlString)
    const host = url.hostname
    return host === "localhost" || host.includes(".")
  } catch {
    return false
  }
}
