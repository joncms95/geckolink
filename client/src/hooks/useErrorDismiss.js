import { useEffect } from "react"
import { ERROR_DISMISS_MS } from "../constants"

/**
 * Sets up auto-dismiss after timeout and dismiss on document click/touch.
 * Call with (errorState, setError, optionalMs). No return value.
 */
export function useErrorDismiss(errorState, setError, ms = ERROR_DISMISS_MS) {
  useEffect(() => {
    if (!errorState) return
    const t = setTimeout(() => setError(null), ms)
    return () => clearTimeout(t)
  }, [errorState, setError, ms])

  useEffect(() => {
    if (!errorState) return
    const clear = () => setError(null)
    document.addEventListener("mousedown", clear)
    document.addEventListener("touchstart", clear, { passive: true })
    return () => {
      document.removeEventListener("mousedown", clear)
      document.removeEventListener("touchstart", clear)
    }
  }, [errorState, setError])
}
