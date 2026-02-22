import { useState, useCallback, useEffect } from "react"
import { getSession, login as apiLogin, logout as apiLogout, signup as apiSignup } from "../api/auth"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await apiLogin(email, password)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const signup = useCallback(async (email, password, passwordConfirmation) => {
    const u = await apiSignup(email, password, passwordConfirmation)
    setUser(u)
    return u
  }, [])

  return { user, authLoading, login, logout, signup }
}
