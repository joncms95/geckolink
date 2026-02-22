import { useState, useCallback, useEffect } from "react"
import {
  AUTH_CACHE_KEY,
  getCachedUser,
  setCachedUser,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
} from "../api/auth"

export function useAuth() {
  const [user, setUser] = useState(getCachedUser)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    setUser(getCachedUser())
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === AUTH_CACHE_KEY) setUser(getCachedUser())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
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

  /** Clear auth state locally without calling API (e.g. when session invalidated by 401). */
  const clearSessionLocally = useCallback(() => {
    setCachedUser(null)
    setUser(null)
  }, [])

  const signup = useCallback(async (email, password, passwordConfirmation) => {
    const u = await apiSignup(email, password, passwordConfirmation)
    setUser(u)
    return u
  }, [])

  return { user, authLoading, login, logout, clearSessionLocally, signup }
}
