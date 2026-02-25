/**
 * Scrolls so the user sees the right content. Use after navigation or page changes.
 *
 * @param {string} [target] - Optional. If provided, scrolls the element with
 *   data-scroll-target="{target}" into view (e.g. "dashboard", "link-list").
 *   Otherwise scrolls the window to (0, 0).
 */
export function scrollToTop(target) {
  if (target && typeof target === "string") {
    const el = document.querySelector(`[data-scroll-target="${target}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
  }
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
}
