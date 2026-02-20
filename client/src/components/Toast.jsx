import { useEffect } from "react"

export default function Toast({ message, onDismiss, visible }) {
  useEffect(() => {
    if (!visible || !onDismiss) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed top-20 right-4 z-50 flex items-center gap-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card px-4 py-3 shadow-lg animate-slide-up"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gecko-green/20 text-gecko-green shrink-0">
        <i className="fa-solid fa-check text-xl" aria-hidden />
      </span>
      <p className="text-sm font-medium text-white">{message}</p>
    </div>
  )
}
