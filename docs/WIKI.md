# Wiki: Short Code Generation Strategy

## The Problem

We need to generate short, URL-safe strings (Short URLs) that map to long Target URLs.
**Constraint:** Multiple Short URLs can share the same Target URL (1:N relationship).

## Evaluated Solutions

### Approach A: Hashing (MD5/SHA)

Taking a hash of the target URL (e.g., `MD5(target_url)`).

- **Pros:** Deterministic.
- **Cons:** Violates the requirement that "Multiple Short URLs can share the same Target URL". Hashing the same URL twice produces the same hash.

### Approach B: Base62 Encoding of Database ID

Converting the auto-incrementing Primary Key ID to Base62 (0-9, a-z, A-Z).

- **Pros:** Guaranteed uniqueness, no collisions, extremely fast.
- **Cons:** Predictable. If I get code `b`, I know `c` is next. This exposes business volume to competitors and allows enumeration attacks.

### Approach C: Random Alphanumeric String (Selected Solution)

Generating a random 7-character string using a cryptographically secure pseudo-random number generator (CSPRNG).

#### Implementation Details

We define the alphabet as `[A-Z, a-z, 0-9]`.

1.  Generate a random 7-char string.
2.  Attempt to insert into DB.
3.  If a `UniqueConstraintViolation` occurs (collision), retry up to 3 times.

**Why 7 characters?**
With 62 characters, a length of 7 gives us $62^7$ combinations (~3.5 trillion).

- At 1,000 links generated per second, it would take ~100 years to reach a 1% collision probability.

#### Limitations & Workarounds

1.  **The "Birthday Problem" (Collisions):**
    - _Limitation:_ As the database fills up, the probability of generating a duplicate random string increases, requiring more retries and slowing down writes.
    - _Workaround:_ We implement a "Retry Limit" strategy. If 3 attempts fail, we switch to a fallback strategy (pre-generated keys or appending a nanosecond timestamp). Given the 3.5 trillion search space, this is theoretically negligible for this startup phase.

2.  **Profanity/Offensive Words:**
    - _Limitation:_ Random generation might accidentally produce offensive words.
    - _Workaround:_ We use a "Blocklist" filter or remove vowels/confusing characters (like l, 1, I, o, 0) from the allowed alphabet (Base58) to reduce visual ambiguity and offensive potential.
