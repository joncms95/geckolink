# Wiki: Short URL Generation Strategy

## The Problem

We need to generate short, URL-safe strings (short keys) that map to long target URLs.

**Constraint:** Multiple short URLs can share the same target URL (1:N relationship).

## Evaluated Solutions

### Approach A: Hashing (MD5/SHA)

Taking a hash of the target URL (e.g., `MD5(target_url)`).

- **Pros:** Deterministic.
- **Cons:** Violates the 1:N requirement. Hashing the same URL twice produces the same hash, so two users shortening the same URL would collide.

### Approach B: Base62 Encoding of Database ID

Converting the auto-incrementing primary key to Base62 (`0-9`, `a-z`, `A-Z`). After insert, encode the new row's ID to get the short code.

- **Pros:** Guaranteed uniqueness (ID is the source of truth), no collisions, extremely fast.
- **Cons:** Predictable. Sequential codes expose business volume and allow enumeration attacks.

### Approach C: Random Alphanumeric String (Selected)

Generating a random string using a cryptographically secure pseudo-random number generator (CSPRNG).

## Implementation

**Code:** `Shortener::RandomKey` generates the key via `SecureRandom.alphanumeric(length)`; `Shortener::CreateService` handles persistence and collision retries.

### Alphabet

`[A-Z, a-z, 0-9]` — 62 characters. `SecureRandom.alphanumeric` produces a uniform distribution.

### Default Length: 7 Characters

With 62 characters and length 7, we get \(62^7 \approx 3.5\) trillion combinations.

At 1,000 links generated per second, it would take ~100 years to reach a 1% collision probability.

### Collision Handling

1. Generate a random 7-character key (`SecureRandom.alphanumeric(7)`).
2. Attempt to insert into the database (the `key` column has a unique index).
3. If a unique-constraint violation occurs, retry — up to 3 times.
4. If all 3 retries fail, fall back to an **8-character key** (\(62^8 \approx 218\) trillion combinations) for one final attempt.
5. If that also fails, the service returns a failure result.

### Limitations

As the database fills, collision probability increases and retries slow down writes. The fallback to 8 characters mitigates this.
