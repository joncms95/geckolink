import { useEffect, useRef } from "react"

const AUTO_DISMISS_MS = 5000

export default function Toast({ message, onDismiss, visible, autoDismissMs = AUTO_DISMISS_MS }) {
  const toastRef = useRef(null)

  useEffect(() => {
    if (!visible || !onDismiss) return
    const t = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [visible, onDismiss, autoDismissMs])

  useEffect(() => {
    if (!visible || !onDismiss) return
    const handleClickOutside = (e) => {
      if (toastRef.current && !toastRef.current.contains(e.target)) {
        onDismiss()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      ref={toastRef}
      role="status"
      className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 flex items-center gap-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card px-4 py-3 shadow-lg animate-slide-up"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gecko-green/20 text-gecko-green shrink-0">
        <i className="fa-solid fa-check text-xl" aria-hidden />
      </span>
      <p className="text-sm font-medium text-white">{message}</p>
    </div>
  )
}
