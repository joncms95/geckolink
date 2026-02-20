# Development Roadmap

## Phase 1: Foundation & Infrastructure

- [x] Initialize Rails 7.2 app with PostgreSQL and -T (skip test) flags.
- [x] Configure Docker and Docker Compose (App, Postgres, Redis).
- [x] Set up RSpec, FactoryBot, and DatabaseCleaner.

## Phase 2: Core Backend Logic (The Shortener)

- [x] **Model**: Create `Link` model (columns: `url`, `short_code`, `title`, `clicks_count`).
- [x] **Migration**: Add unique index on `short_code`.
- [x] **Service**: Implement `Shortener::CreateService`.
  - Input: `original_url`
  - Logic: Insert record, then set `short_code` from Base62 encoding of new ID, handle URL validation.
- [x] **Controller**: Create `Api::V1::LinksController` (create, show).
- [x] **Route**: specific route for `/:short_code` redirection.
- [x] **Spec**: Unit tests for URL validation.

## Phase 3: Background Jobs & Metadata

- [x] **Job**: `TitleFetcherJob`.
  - Use `Nokogiri` to parse `<title>`.
  - Handle timeouts and non-HTML responses.
- [x] **Integration**: Trigger Job upon successful Link creation.

## Phase 4: Analytics & Tracking

- [x] **Model**: Create `Visit` model (columns: `link_id`, `ip_address`, `user_agent`, `geolocation`, `timestamp`).
- [x] **Middleware/Service**: Track click events asynchronously.
- [x] **Job**: `GeolocateIpJob`.
  - Use `Geocoder` gem or MaxMind DB.
  - Update `Visit` records with City/Country.
- [x] **Query Object**: `Analytics::ReportQuery` to aggregate clicks by country and hour.

## Phase 5: Frontend (React)

- [x] Initialize React within the Rails ecosystem (Vite).
- [x] **Component**: URL Submission Form (with error states).
- [x] **Component**: Result Card (Short URL, Copy to Clipboard, Title).
- [x] **Component**: Analytics Dashboard (Simple chart/table of clicks).

## Phase 6: Polish & Deployment

- [ ] **Security**: Add Rack::Attack for rate limiting.
- [ ] **Docs**: Finalize README and WIKI.
- [ ] **Deploy**: Heroku or Render configuration.
