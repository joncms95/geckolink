export function parseShortCode(input) {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    if (trimmed.includes("/") || trimmed.startsWith("http")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
      const path = url.pathname.replace(/^\/+|\/+$/g, "")
      return path || null
    }
    return trimmed
  } catch {
    return trimmed
  }
}
