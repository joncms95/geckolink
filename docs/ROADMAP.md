# Development Roadmap

## Phase 1: Foundation & Infrastructure

- [x] Initialize Rails 7.2 app with PostgreSQL and -T (skip test) flags.
- [x] Configure Docker and Docker Compose (App, Postgres, Redis).
- [x] Set up RSpec, FactoryBot, and DatabaseCleaner.

## Phase 2: Core Backend Logic (The Shortener)

- [x] **Model**: Create `Link` model (columns: `target_url`, `key`, `title`, `icon_url`, `clicks_count`).
- [x] **Migration**: Add unique index on `key`.
- [x] **Service**: Implement `Shortener::CreateService`.
  - Input: `original_url`
  - Logic: Insert record, assign random key via `Shortener::RandomKey` (CSPRNG), retry on collision; handle URL validation.
- [x] **Controller**: Create `Api::V1::LinksController` (create, show).
- [x] **Route**: specific route for `/:key` redirection.
- [x] **Spec**: Unit tests for URL validation.

## Phase 3: Background Jobs & Metadata

- [x] **Title/icon fetch**: Synchronous fetch in create flow via `Metadata::TitleAndIconFetcher` (Nokogiri, timeouts, non-HTML handled).

## Phase 4: Analytics & Tracking

- [x] **Model**: Create `Click` model (columns: `link_id`, `clicked_at`, `ip_address`, `user_agent`, `geolocation`, `country`).
- [x] **Click recording**: `Analytics::RecordClick` creates click and fills geolocation synchronously (Geocoder, 2s timeout).
- [x] **Query Object**: `Analytics::ReportQuery` to aggregate clicks by country and hour.

## Phase 5: Frontend (React)

- [x] Initialize React within the Rails ecosystem (Vite).
- [x] **Component**: URL Submission Form (with error states).
- [x] **Component**: Result Card (Short URL, Copy to Clipboard, Title).
- [x] **Component**: Analytics Dashboard (Simple chart/table of clicks).

## Phase 6: Polish & Deployment

- [x] **Security**: Add Rack::Attack for rate limiting.
- [x] **Docs**: Finalize README and WIKI.
- [ ] **Deploy**: Heroku or Render configuration.
