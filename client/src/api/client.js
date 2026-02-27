/**
 * API client. All HTTP requests go through fetchWithTimeout + handleResponse.
 * Auth token is stored in localStorage and attached to every request automatically.
 */
import { ApiError, getMessageFromBody } from "./errors";

const origin = import.meta.env?.VITE_API_BASE ?? "";
const API_BASE = `${origin}/api/v1`;

export const TOKEN_KEY = "geckolink_token";

export function getApiBase() {
  return API_BASE;
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (e.g. private browsing) */
  }
}

/** fetch() wrapper that adds auth headers and aborts after timeoutMs. */
export function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { ...authHeaders(), ...options.headers };
  return fetch(url, { ...options, headers, signal: controller.signal }).finally(
    () => clearTimeout(id),
  );
}

/**
 * Parses JSON and throws ApiError on non-ok responses.
 * Callers use formatApiError(err) for the message string and err.status for status (e.g. 404).
 */
export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(getMessageFromBody(data), res.status);
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
