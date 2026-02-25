import { useCallback, useEffect, useState } from "react"
import { scrollToTop } from "../utils/scroll"

const SCROLL_OFFSET_PX = 400

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  const updateVisible = useCallback(() => {
    setVisible(window.scrollY > SCROLL_OFFSET_PX)
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisible()
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    updateVisible()
    return () => window.removeEventListener("scroll", onScroll)
  }, [updateVisible])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => scrollToTop()}
      className="fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gecko-green text-gecko-dark shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark min-h-[48px] min-w-[48px] touch-manipulation"
      aria-label="Scroll to top"
    >
      <i className="fa-solid fa-arrow-up-long text-xl" aria-hidden />
    </button>
  )
}
