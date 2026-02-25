# GeckoLink

GeckoLink is a URL shortener with real-time analytics and geolocation tracking. Paste a long URL to get a short link, share it anywhere, and see click counts and locations in a simple dashboard. You can use it without an account or sign up to keep all your links in one place.

## Live Demo

**[GeckoLink](https://geckolink.vercel.app)** — shorten URLs and try the dashboard.

A test account is available for trying the app:

- **Email:** testuser@gmail.com
- **Password:** geckolinkdemo

Log in to see the analytics dashboard with sample links.

---

## Tech Stack

- **Backend:** Ruby 3.4.8, Rails 7.2.3 (API Mode)
- **Database:** PostgreSQL 16
- **Caching:** Redis 7 (redirect lookups)
- **Frontend:** React 18 (Vite), Tailwind CSS, React Router 7
- **Auth:** bcrypt + Bearer tokens
- **Testing:** RSpec, FactoryBot, Faker, WebMock
- **Code style:** Rufo (formatting), RuboCop (lint)
- **Containerization:** Docker & Docker Compose

---

## Architecture & Design Decisions

### 1. Domain Design

**Service Objects** and **Query Objects** keep controllers thin and business logic testable.

- `Shortener::CreateService` — generates a unique short key, creates the link, and fetches page metadata.
- `Redirect::ResolveService` — resolves a short key to a target URL with Redis-backed caching.
- `Analytics::RecordClick` — records each redirect with IP geolocation (Geocoder).
- `Analytics::ReportQuery` — aggregates click data by country and hour for the analytics dashboard.
- `Dashboard::StatsQuery` — returns cached dashboard aggregates (total links, total clicks, top location) per user.
- `Metadata::TitleAndIconFetcher` — extracts the page `<title>` and favicon from the target URL.

All services return a `Result` value object (`success?` / `failure?`) instead of raising exceptions for expected flow control.

### 2. Authentication

- **Signup / Login** return a Bearer token. The client stores it in `localStorage` and sends it in the `Authorization` header on every request.
- **Sessions** are stored server-side (`sessions` table) and validated on each authenticated request via the `Authentication` concern.
- Token-based auth works cross-origin and on mobile without cookies.

### 3. Dashboard Stats

The dashboard summary (total links, total clicks, top location) is loaded **asynchronously** — the link list and stats are fetched in parallel so the page renders immediately without blocking on either request.

- **Backend:** `GET /api/v1/dashboard/stats` is backed by `Dashboard::StatsQuery`, which aggregates `links.count`, `SUM(clicks_count)`, and the most-clicked country across all user links. Results are cached in Rails cache (2-minute TTL) to avoid running those aggregations on every page load.
- **Cache invalidation:** The cache is cleared when a user creates a new link and when a click is recorded on any of their links. That way `total_links`, `total_clicks`, and `top_location` stay up to date on the next dashboard load; the TTL only guards against repeated reads within a short window.
- **Frontend:** The `useDashboardStats` hook fires its own `fetch` independent of the link list. While loading, the metric cards show a spinner; on error, an inline banner appears with the message. The link list renders and paginates without waiting for stats.

### 4. User-Owned vs. Anonymous Links

- **Anonymous links** (`user_id` is `NULL`) can be created without an account and are publicly accessible (anyone can view stats via the lookup form or direct URL).
- **Logged-in users** have links associated with their account. The dashboard (`GET /api/v1/links`) shows only that user's links, paginated. User-owned links are restricted to the owner for `show` and `analytics`.

### 5. Link Metadata & Geolocation

When a user creates a short link, the app fetches the target page’s **title and favicon** so the dashboard can show a recognizable label and icon instead of a bare URL.

- **Title and favicon fetching** — After creating the link, the backend fetches the target URL with a **8 s maximum** for the whole metadata step. Within that, each HTTP request uses a **4 s** timeout (HTML page, manifest), and DuckDuckGo favicon checks use **2 s** each. It normalizes schemeless URLs (e.g. `facebook.com` → `https://facebook.com`), fetches HTML, and extracts:
  - **Title** from `<title>`, `og:title`, or `twitter:title` (if missing, the UI shows a dash).
  - **Favicon** from the web app manifest, then `<link rel="icon">`, then [DuckDuckGo’s favicon service](https://icons.duckduckgo.com/ip3) as a fallback. For DuckDuckGo, the app tries the **actual host** first (e.g. `www.touchngo.com.my` if that’s what the user entered), then the alternate (with or without `www`) if the first returns 404, so icons work for both apex and www domains. Same-origin favicon URLs are replaced with the DuckDuckGo URL so icons load reliably in the app (avoids CORS/redirect issues). Cross-origin icons (e.g. CDN) are kept. If the fetch fails (timeout, non-HTML, error), the link still gets a DuckDuckGo favicon so the icon slot is never empty; the title is left blank (dash).
- **Geolocation** — On each redirect, IP-to-location is resolved via Geocoder (2 s timeout) so analytics have country data without a background worker.

### 6. Scalability

- **Redirect lookups** are cached in Redis for 5 minutes to reduce DB load.
- **Write Strategy** — a unique index on `links.key` prevents race-condition duplicates; the service retries with a longer key on collision.
- **Health check** — `GET /up` reports boot status.

---

## API Endpoints

| Method   | Path                           | Auth     | Description               |
| -------- | ------------------------------ | -------- | ------------------------- |
| `POST`   | `/api/v1/links`                | Optional | Create a short link       |
| `GET`    | `/api/v1/links`                | Required | List current user's links |
| `GET`    | `/api/v1/links/:key`           | Optional | Get link details          |
| `GET`    | `/api/v1/links/:key/analytics` | Optional | Get click analytics       |
| `GET`    | `/api/v1/dashboard/stats`      | Required | Dashboard summary stats   |
| `POST`   | `/api/v1/session`              | None     | Log in                    |
| `DELETE` | `/api/v1/session`              | None     | Log out                   |
| `POST`   | `/api/v1/signup`               | None     | Register                  |
| `GET`    | `/:key`                        | None     | Redirect to target URL    |

---

## Installation & Setup

### Prerequisites

- Ruby 3.4.8
- PostgreSQL 16
- Redis
- Node.js 20+

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/joncms95/geckolink.git
   cd geckolink
   bundle install
   npm install --prefix client
   ```

2. **Database setup**

   ```bash
   cp .env.example .env
   bin/rails db:prepare
   ```

3. **Start services** (Rails + Vite dev server via foreman)

   ```bash
   bin/dev
   ```

4. **Run tests**

   Use the shortcut to run the full pipeline (format, lint, security scan, tests). In CI the same script runs in check-only mode so the job fails if format or lint need fixing:

   ```bash
   bin/ci
   ```

   Or run only the RSpec suite:

   ```bash
   bundle exec rspec
   ```

### Deployment

The backend is deployed via Docker Compose on a DigitalOcean droplet; the React frontend is deployed on Vercel. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for full instructions.

**Environment variables:**

| Variable               | Required | Description                                         |
| ---------------------- | -------- | --------------------------------------------------- |
| `SECRET_KEY_BASE`      | Prod     | Rails secret (generate with `openssl rand -hex 64`) |
| `POSTGRES_PASSWORD`    | Docker   | PostgreSQL password                                 |
| `DATABASE_URL`         | Prod     | PostgreSQL connection string                        |
| `REDIS_URL`            | Prod     | Redis connection string                             |
| `VITE_API_BASE`        | Frontend | API base URL (no trailing slash)                    |
| `DISABLE_SSL_REDIRECT` | Optional | Set to `1` when serving over plain HTTP             |

---

## Security

- **Input Sanitization** — target URLs are validated against a strict scheme to block `javascript:` URIs and private-network hosts.
- **Rate Limiting** — `Rack::Attack` throttles link creation, redirects, signup, and login per IP.
- **Authentication** — passwords are hashed with bcrypt; sessions are bearer-token-based with server-side storage.
- **Error Handling** — structured JSON error responses for 403/404; the frontend shows a dedicated 404 page for unknown routes and contextual messages for API errors.

---

## Project Structure

```
app/
  controllers/         # Thin API controllers
    api/v1/            # Links, Session, Registrations
    concerns/          # Authentication concern
  models/              # User, Link, Click, Session
  services/            # Service objects (Shortener, Analytics, Redirect, Metadata)
  queries/             # Query objects (Analytics::ReportQuery, Dashboard::StatsQuery)
client/
  src/
    api/               # API client (fetch wrappers)
    components/        # React components
    hooks/             # Custom hooks (useAuth, useToast, useLinksList, useCopyToClipboard)
    pages/             # Route pages (HomePage, NotFoundPage)
    utils/             # Utilities (URL normalization, error formatting, scroll)
    constants/         # Shared constants
config/                # Rails configuration
spec/                  # RSpec tests (models, requests, services, queries)
docs/                  # DEPLOY, QUESTION, ROADMAP, WIKI, RULES
```

## Code style

- **Rufo** — Ruby formatter. Run `bundle exec rufo .` to format the codebase, or rely on `bin/ci`, which runs Rufo first (same as the GitHub Actions pipeline). Options are in the project root [`.rufo`](.rufo) file (e.g. double quotes, trailing commas off, aligned `case`/`when` and chained calls).
- **RuboCop** — Linting and auto-correct via `bin/rubocop -A`; also runs as part of `bin/ci`.

## License

MIT
