# GeckoLink

GeckoLink is a robust, scalable microservice for URL shortening, featuring real-time analytics, geolocation tracking, and asynchronous metadata fetching.

## 🚀 Live Demo

**[https://geckolink-demo.com](https://geckolink-demo.com)** _(Placeholder)_

---

## 🛠 Tech Stack

We utilize a modern, reliable stack aligned with high-throughput requirements:

- **Backend:** Ruby 3.4.8, Rails 7.2.3 (API Mode)
- **Database:** PostgreSQL 16 (Primary data store)
- **Caching/Queue:** Redis 7 (Sidekiq queues & caching)
- **Frontend:** React 18 (via Vite), Tailwind CSS
- **Testing:** RSpec, FactoryBot, Faker
- **Background Jobs:** Sidekiq (Title fetching, Geolocation processing)
- **Containerization:** Docker & Docker Compose

---

## 🏗 Architecture & Design Decisions

### 1. Domain Design

We utilize **Service Objects** and **Query Objects** to keep controllers skinny and business logic testable.

- `Shortener::CreateService`: Handles the generation logic and initial record creation.
- `Analytics::ReportQuery`: specialized query object to aggregate click data, ensuring the database handles the heavy lifting for reports.

### 2. Async Processing

To ensure low latency for the user:

1.  **URL Title Fetching**: When a user submits a link, we return the short URL immediately. A Sidekiq job (`TitleFetcherJob`) runs in the background to scrape the HTML `<title>` tag and update the record.
2.  **Geolocation**: Click analytics are processed asynchronously. When a link is visited, we log the raw event and process IP-to-Location (using GeoIP) in a background worker to avoid slowing down the redirect.

### 3. Scalability

- **Redirect lookups**: Short code → URL is cached (Rails.cache) for 5 minutes to reduce DB load on redirects. In production, set `config.cache_store = :redis_cache_store, { url: ENV["REDIS_URL"] }` so the cache is shared across instances.
- **Write Strategy**: We utilize unique indexes on the `short_code` column to prevent race conditions at the database level.
- **Health checks**: The `/up` endpoint reports app boot status. For HA, configure your platform to also check DB connectivity (e.g. a custom endpoint that runs `ActiveRecord::Base.connection.execute("SELECT 1")`) or rely on the default `/up` and platform health checks.

---

## 📦 Installation & Setup

### Prerequisites

- Ruby 3.4.8
- Postgres 16
- Redis
- Node.js 20+

### Local Development

1.  **Clone and Install Dependencies**

    ```bash
    git clone [https://github.com/your-username/geckolink.git](https://github.com/your-username/geckolink.git)
    cd geckolink
    bundle install
    npm install --prefix client
    ```

2.  **Database Setup**

    ```bash
    cp .env.example .env
    bin/rails db:prepare
    ```

3.  **Start Services**
    We use `foreman` to run Rails, Sidekiq, and the Vite dev server simultaneously.

    ```bash
    bin/dev
    ```

4.  **Run Tests**
    ```bash
    bundle exec rspec
    ```
    Backend is covered by RSpec (unit and request specs). The React frontend is manually tested; add Vitest or Jest for automated frontend tests if desired.

### Deployment

The app is not deployed by default. To deploy (e.g. Render, Heroku):

- **Web**: Run `bin/rails server` (or the platform’s Rails command). Set `PORT` and `RAILS_ENV=production`.
- **Worker**: Run `bundle exec sidekiq` for background jobs (title fetching, geolocation).
- **Env**: Set `DATABASE_URL`, `REDIS_URL`, and `RAILS_MASTER_KEY` (for credentials). See `.env.example`.
- **Build**: For a single dyno/instance, build the React client (`npm run build --prefix client`) and serve from `client/dist` or your CDN; or run API and frontend separately and set CORS (see `config/initializers/cors.rb`).

The repo includes a production Dockerfile; use it with your orchestrator or a platform that supports Docker.

---

## 🛡 Security

- **Input Sanitization**: All target URLs are validated against a strict regex scheme to prevent Javascript injection (`javascript:`) or local network scanning.
- **Rate Limiting**: `Rack::Attack` throttles requests per IP for link creation and redirects to limit abuse.

## 📝 License

MIT
