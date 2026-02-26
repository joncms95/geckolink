import { normalizeErrors } from "./errors";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : "") + "/api/v1";

export const TOKEN_KEY = "geckolink_token";

export function getApiBase() {
  return API_BASE;
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { ...authHeaders(), ...options.headers };
  return fetch(url, { ...options, headers, signal: controller.signal }).finally(
    () => clearTimeout(id),
  );
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new UnauthorizedError();
    throw { status: res.status, errors: normalizeErrors(data) };
  }
  return data;
}

function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
