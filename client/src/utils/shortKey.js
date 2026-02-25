const VALID_KEY_REGEX = /^[0-9a-zA-Z]{1,15}$/

function validKey(str) {
  return str && VALID_KEY_REGEX.test(str) ? str : null
}

export function parseShortKey(input) {
  const trimmed = (input ?? "").trim()
  if (!trimmed) return null
  try {
    if (trimmed.includes("/") || trimmed.startsWith("http")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
      const path = url.pathname.replace(/^\/+|\/+$/g, "").trim()
      return validKey(path)
    }
    return validKey(trimmed)
  } catch {
    return null
  }
}
