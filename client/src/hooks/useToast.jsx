import { createContext, useCallback, useContext, useState } from "react"
import Toast from "../components/Toast"

const ToastContext = createContext(null)

const DEFAULT_DISMISS_MS = 5000

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, autoDismissMs = DEFAULT_DISMISS_MS) => {
    setToast({ message, autoDismissMs })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <Toast
        message={toast?.message}
        visible={!!toast}
        onDismiss={dismissToast}
        autoDismissMs={toast?.autoDismissMs}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
