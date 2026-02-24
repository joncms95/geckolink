import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { login as apiLogin, logout as apiLogout, signup as apiSignup } from "../api/auth"
import { TOKEN_KEY } from "../api/client"

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

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TOKEN_KEY && e.newValue === null) {
        setCachedUser(null)
        setUser(null)
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

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

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
