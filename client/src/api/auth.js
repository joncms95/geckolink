const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1"

export async function getSession() {
  const res = await fetch(`${API_BASE}/session`, { credentials: "include" })
  if (res.status === 401) return null
  const data = await res.json().catch(() => ({}))
  return data?.user ?? null
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/session`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ session: { email: email?.trim()?.toLowerCase(), password } }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, errors: data.errors || ["Login failed"] }
  return data?.user ?? null
}

export async function logout() {
  await fetch(`${API_BASE}/session`, { credentials: "include", method: "DELETE" })
}

export async function signup(email, password, passwordConfirmation) {
  const res = await fetch(`${API_BASE}/signup`, {
    credentials: "include",
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
