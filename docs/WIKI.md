# Wiki: Short URL Generation Strategy

## The Problem

We need to generate short, URL-safe strings (Short URLs) that map to long Target URLs.

**Constraint:** Multiple Short URLs can share the same Target URL (1:N relationship).

## Evaluated Solutions

### Approach A: Hashing (MD5/SHA)

Taking a hash of the target URL (e.g., `MD5(target_url)`).

- **Pros:** Deterministic.
- **Cons:** Violates the requirement that "Multiple Short URLs can share the same Target URL". Hashing the same URL twice produces the same hash.

### Approach B: Random Alphanumeric String

Generating a random 7-character string using a CSPRNG from alphabet `[A-Z, a-z, 0-9]`; on collision, retry (e.g. up to 3 times).

- **Pros:** Unpredictable; supports 1:N; large space ($62^7$ ~3.5 trillion).
- **Cons:** Collisions require retry/fallback logic; More complexity than we need.

### Approach C: Base62 Encoding of Database ID (Selected Solution)

Converting the auto-incrementing Primary Key ID to Base62 (0-9, a-z, A-Z). After insert, encode the new row’s ID to get the short code; no randomness, no collision handling.

- **Pros:** Guaranteed uniqueness (ID is the source of truth), no collisions, extremely fast, simple to implement. Fits 1:N (every new row gets a new code). No retry or fallback logic.
- **Cons:** Predictable. If I get code `b`, I know `c` is next. This exposes business volume to competitors and allows enumeration attacks. For this URL shortener, predictability is not a significant concern.

**Why Base62 over Random (B)?** We prefer simplicity and operational reliability. Random forces collision handling, retry limits, and optional blocklists; Base62 avoids collisions entirely and keeps the implementation small. Predictability is an acceptable tradeoff for this use case.

## Limitations and workarounds

- **Short code length (max 15 characters):** The spec requires short URL paths to not exceed 15 characters. For IDs below \(62^{15}\) (~768×10¹⁵ links), the short code is at most 15 characters. The application enforces this via a model validation. If the service ever approaches that scale, a different encoding or namespace would be needed; for typical usage this limit is effectively unreachable.

- **Predictability:** Short codes are sequential (id 1 → "1", id 62 → "10"). Anyone can enumerate existing links by guessing the next code. Mitigations: rate limiting on creation and redirect (see Rack::Attack), and optionally requiring authentication for sensitive links in a future iteration.

- **Operational limits:** Title fetching and geolocation depend on external services (target URL availability, GeoIP provider). Failures are handled asynchronously and do not block the user; the link remains usable with a null title or geolocation until the job succeeds or is retried.
