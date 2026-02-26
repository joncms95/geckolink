import {
  fetchWithTimeout,
  getApiBase,
  handleResponse,
  setAuthToken,
} from "./client";

export async function login(email, password) {
  const res = await fetchWithTimeout(`${getApiBase()}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      session: { email: email?.trim()?.toLowerCase(), password },
    }),
  });
  const data = await handleResponse(res);
  if (data?.token) setAuthToken(data.token);
  return data?.user ?? null;
}

export async function logout() {
  try {
    await fetchWithTimeout(`${getApiBase()}/session`, { method: "DELETE" });
  } catch {
    // Best-effort — clear local state regardless
  }
  setAuthToken(null);
}

export async function signup(email, password, passwordConfirmation) {
  const res = await fetchWithTimeout(`${getApiBase()}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      user: {
        email: email?.trim()?.toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      },
    }),
  });
  const data = await handleResponse(res);
  if (data?.token) setAuthToken(data.token);
  return data?.user ?? null;
}
