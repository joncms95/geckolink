# Development Roadmap

## Phase 1: Foundation & Infrastructure

- [x] Initialize Rails 7.2 app with PostgreSQL (API-only mode).
- [x] Configure Docker and Docker Compose (App, Postgres, Redis).
- [x] Set up RSpec, FactoryBot, DatabaseCleaner, and WebMock.

## Phase 2: Core Backend Logic (The Shortener)

- [x] **Model**: Create `Link` model (`target_url`, `key`, `title`, `icon_url`, `clicks_count`).
- [x] **Migration**: Add unique index on `key`.
- [x] **Service**: Implement `Shortener::CreateService` — random key via `Shortener::RandomKey` (`SecureRandom.alphanumeric`), retry on collision, URL validation.
- [x] **Service**: Implement `Redirect::ResolveService` — resolve key to target URL with Redis-backed caching (5 min TTL).
- [x] **Controller**: `Api::V1::LinksController` (create, show, index, analytics).
- [x] **Controller**: `RedirectsController` — `GET /:key` redirection.
- [x] **Specs**: Unit tests for URL validation, service objects, and request specs for all endpoints.

## Phase 3: Metadata Fetching

- [x] **Service**: `Metadata::TitleAndIconFetcher` — fetch page `<title>` and favicon (Nokogiri; 4 s HTTP timeout, 8 s max for metadata step; DuckDuckGo fallback for favicon when fetch fails or same-origin).

## Phase 4: Analytics & Tracking

- [x] **Model**: Create `Click` model (`link_id`, `clicked_at`, `ip_address`, `user_agent`, `geolocation`, `country`).
- [x] **Service**: `Analytics::RecordClick` — records click with geolocation via Geocoder (3 s timeout). Invoked asynchronously via `RecordClickJob` so redirects are not blocked.
- [x] **Job**: `RecordClickJob` — enqueued on each redirect; runs click insert, `clicks_count` increment, and geolocation in background (Sidekiq in production).
- [x] **Query Object**: `Analytics::ReportQuery` — aggregates clicks by country and hour.

## Phase 5: Authentication & User Accounts

- [x] **Model**: `User` (email, password_digest via bcrypt) and `Session` (token, user_id).
- [x] **Concern**: `Authentication` — Bearer-token auth, `current_user`, `require_authentication!`.
- [x] **Controller**: `Api::V1::SessionController` (login / logout).
- [x] **Controller**: `Api::V1::RegistrationsController` (signup).
- [x] **Links ownership**: Logged-in users' links are associated with their account; `index` returns only that user's links (paginated). Anonymous links remain publicly accessible.

## Phase 6: Frontend (React + Vite + Tailwind)

- [x] Initialize React SPA within the Rails ecosystem (Vite dev server, proxy to Rails API).
- [x] **Page**: Home — URL submission form with validation, result card (short URL, title, favicon, copy to clipboard).
- [x] **Page**: Dashboard — analytics overview (metrics cards), paginated link list, link detail view with clicks-over-time chart and geolocation breakdown.
- [x] **Auth UI**: Login/signup modal, auth-aware header with logout.
- [x] **Hooks**: `useAuth`, `useToast`, `useLinksList`, `useCopyToClipboard`.

## Phase 7: Security & Polish

- [x] **Rate Limiting**: `Rack::Attack` throttles per IP (link creation, redirects, signup, login).
- [x] **URL Validation**: Strict scheme check, private-host blocking.
- [x] **CORS**: Allowed origins in `config/initializers/cors.rb`.

## Phase 8: Deployment

- [x] **Docker**: Production `Dockerfile`, `docker-compose.yml`, HTTPS override with Nginx + Certbot.
- [x] **Docs**: `DEPLOY.md` with full DigitalOcean + Docker Compose guide (HTTP and HTTPS).
- [x] **Frontend**: Deployed on Vercel (`geckolink.vercel.app`), `vercel.json` SPA rewrites.
- [x] **API**: Deployed on DigitalOcean droplet (`geckolink.click`).
