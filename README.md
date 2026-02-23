# GeckoLink

GeckoLink is a robust, scalable microservice for URL shortening, featuring real-time analytics and geolocation tracking.

## Live Demo

[GeckoLink](https://geckolink.vercel.app)

---

## Tech Stack

- **Backend:** Ruby 3.4.8, Rails 7.2.3 (API Mode)
- **Database:** PostgreSQL 16
- **Caching:** Redis 7 (redirect lookups)
- **Frontend:** React 18 (Vite), Tailwind CSS, React Router 7
- **Auth:** bcrypt + Bearer tokens
- **Testing:** RSpec, FactoryBot, Faker, WebMock
- **Containerization:** Docker & Docker Compose

---

## Architecture & Design Decisions

### 1. Domain Design

**Service Objects** and **Query Objects** keep controllers thin and business logic testable.

- `Shortener::CreateService` — generates a unique short key, creates the link, and fetches page metadata.
- `Redirect::ResolveService` — resolves a short key to a target URL with Redis-backed caching.
- `Analytics::RecordClick` — records each redirect with IP geolocation (Geocoder).
- `Analytics::ReportQuery` — aggregates click data by country and hour for the analytics dashboard.
- `Metadata::TitleAndIconFetcher` — extracts the page `<title>` and favicon from the target URL.

All services return a `Result` value object (`success?` / `failure?`) instead of raising exceptions for expected flow control.

### 2. Authentication

- **Signup / Login** return a Bearer token. The client stores it in `localStorage` and sends it in the `Authorization` header on every request.
- **Sessions** are stored server-side (`sessions` table) and validated on each authenticated request via the `Authentication` concern.
- Token-based auth works cross-origin and on mobile without cookies.

### 3. User-Owned vs. Anonymous Links

- **Anonymous links** (`user_id` is `NULL`) can be created without an account and are publicly accessible (anyone can view stats via the lookup form or direct URL).
- **Logged-in users** have links associated with their account. The dashboard (`GET /api/v1/links`) shows only that user's links, paginated. User-owned links are restricted to the owner for `show` and `analytics`.

### 4. Synchronous Processing

1. **URL Title Fetching** — when a user submits a link, the page title and favicon are fetched synchronously (5 s timeout). If the fetch fails, the link is still created with `NULL` title/icon.
2. **Geolocation** — on each redirect, IP-to-location is resolved synchronously via Geocoder (2 s timeout) so analytics have geolocation data without a background worker.

### 5. Scalability

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

---

## Project Structure

```
app/
  controllers/         # Thin API controllers
    api/v1/            # Links, Session, Registrations
    concerns/          # Authentication concern
  models/              # User, Link, Click, Session
  services/            # Service objects (Shortener, Analytics, Redirect, Metadata)
  queries/             # Query objects (Analytics::ReportQuery)
client/
  src/
    api/               # API client (fetch wrappers)
    components/        # React components
    hooks/             # Custom hooks (useAuth, useToast, useLinksList, useCopyToClipboard)
    pages/             # Route pages (HomePage)
    utils/             # Utilities (URL normalization, error formatting, scroll)
    constants/         # Shared constants
config/                # Rails configuration
spec/                  # RSpec tests (models, requests, services, queries)
docs/                  # DEPLOY, ROADMAP, WIKI, RULES
```

## License

MIT
