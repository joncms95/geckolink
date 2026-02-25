import { useState, useCallback } from "react"

export function useAuthModal() {
  const [authModalMode, setAuthModalMode] = useState(null)

  const openLogin = useCallback(() => setAuthModalMode("login"), [])
  const openSignup = useCallback(() => setAuthModalMode("signup"), [])
  const close = useCallback(() => setAuthModalMode(null), [])

  return { authModalMode, openLogin, openSignup, close }
}
