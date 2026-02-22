import { RECENT_LINKS_KEY, MAX_RECENT_ANONYMOUS } from "../constants"

export function loadRecentLinks() {
  try {
    const raw = localStorage.getItem(RECENT_LINKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ANONYMOUS) : []
  } catch {
    return []
  }
}

export function saveRecentLinks(links) {
  try {
    localStorage.setItem(RECENT_LINKS_KEY, JSON.stringify(links.slice(0, MAX_RECENT_ANONYMOUS)))
  } catch (_) {}
}

export function clearRecentLinks() {
  try {
    localStorage.removeItem(RECENT_LINKS_KEY)
  } catch (_) {}
}
