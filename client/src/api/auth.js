import { getApiBase, defaultFetchOptions, handleResponse } from "./client"

export const AUTH_CACHE_KEY = "geckolink_user"

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedUser(user) {
  try {
    if (user) localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_CACHE_KEY)
  } catch {}
}

export async function login(email, password) {
  const res = await fetch(`${getApiBase()}/session`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ session: { email: email?.trim()?.toLowerCase(), password } }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || ["Login failed"] }
  const user = data?.user ?? null
  setCachedUser(user)
  return user
}

export async function logout() {
  await fetch(`${getApiBase()}/session`, { ...defaultFetchOptions, method: "DELETE" })
  setCachedUser(null)
}

export async function signup(email, password, passwordConfirmation) {
  const res = await fetch(`${getApiBase()}/signup`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      user: { email: email?.trim()?.toLowerCase(), password, password_confirmation: passwordConfirmation },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || ["Sign up failed"] }
  const user = data?.user ?? null
  setCachedUser(user)
  return user
}
