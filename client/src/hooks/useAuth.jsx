import { createContext, useContext, useState, useCallback } from "react"
import { login as apiLogin, logout as apiLogout, signup as apiSignup } from "../api/auth"
import { setAuthToken } from "../api/client"

const AUTH_CACHE_KEY = "geckolink_user"
const AuthContext = createContext(null)

function getCachedUser() {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCachedUser(user) {
  try {
    if (user) localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_CACHE_KEY)
  } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCachedUser)

  const login = useCallback(async (email, password) => {
    const u = await apiLogin(email, password)
    setCachedUser(u)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setCachedUser(null)
    setUser(null)
  }, [])

  const signup = useCallback(async (email, password, passwordConfirmation) => {
    const u = await apiSignup(email, password, passwordConfirmation)
    setCachedUser(u)
    setUser(u)
    return u
  }, [])

  const clearSession = useCallback(() => {
    setCachedUser(null)
    setAuthToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, clearSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
