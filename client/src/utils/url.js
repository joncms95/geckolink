const VALID_HOST_REGEX = /^[^.]+(\.[^.]+)+$/;

export function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function hasValidHost(urlString) {
  try {
    return VALID_HOST_REGEX.test(new URL(urlString).hostname);
  } catch {
    return false;
  }
}
