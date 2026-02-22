import { getApiBase, defaultFetchOptions, handleResponse } from "./client"

export async function getSession() {
  const res = await fetch(`${getApiBase()}/session`, { ...defaultFetchOptions })
  if (res.status === 401) return null
  const data = await res.json().catch(() => ({}))
  return data?.user ?? null
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
  return data?.user ?? null
}

export async function logout() {
  await fetch(`${getApiBase()}/session`, { ...defaultFetchOptions, method: "DELETE" })
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
  return data?.user ?? null
}
