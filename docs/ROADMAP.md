# Development Roadmap

## Phase 1: Foundation & Infrastructure

- [ ] Initialize Rails 7.2 app with PostgreSQL and -T (skip test) flags.
- [ ] Configure Docker and Docker Compose (App, Postgres, Redis).
- [ ] Set up RSpec, FactoryBot, and DatabaseCleaner.

## Phase 2: Core Backend Logic (The Shortener)

- [ ] **Model**: Create `Link` model (columns: `url`, `slug`, `title`, `clicks_count`).
- [ ] **Migration**: Add unique index on `slug`.
- [ ] **Service**: Implement `Shortener::CreateService`.
  - Input: `original_url`
  - Logic: Generate 7-char random slug, handle validation, retry on collision.
- [ ] **Controller**: Create `Api::V1::LinksController` (create, show).
- [ ] **Route**: specific route for `/:slug` redirection.
- [ ] **Spec**: Unit tests for collision handling and URL validation.

## Phase 3: Background Jobs & Metadata

- [ ] **Job**: `TitleFetcherJob`.
  - Use `Nokogiri` to parse `<title>`.
  - Handle timeouts and non-HTML responses.
- [ ] **Integration**: Trigger Job upon successful Link creation.

## Phase 4: Analytics & Tracking

- [ ] **Model**: Create `Visit` model (columns: `link_id`, `ip_address`, `user_agent`, `geolocation`, `timestamp`).
- [ ] **Middleware/Service**: Track click events asynchronously.
- [ ] **Job**: `GeolocateIpJob`.
  - Use `Geocoder` gem or MaxMind DB.
  - Update `Visit` records with City/Country.
- [ ] **Query Object**: `Analytics::ReportQuery` to aggregate clicks by country and hour.

## Phase 5: Frontend (React)

- [ ] Initialize React within the Rails ecosystem (Vite).
- [ ] **Component**: URL Submission Form (with error states).
- [ ] **Component**: Result Card (Short URL, Copy to Clipboard, Title).
- [ ] **Component**: Analytics Dashboard (Simple chart/table of clicks).

## Phase 6: Polish & Deployment

- [ ] **Security**: Add Rack::Attack for rate limiting.
- [ ] **Docs**: Finalize README and WIKI.
- [ ] **Deploy**: Heroku or Render configuration.
