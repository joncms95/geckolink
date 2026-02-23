# GeckoLink

GeckoLink is a robust, scalable microservice for URL shortening, featuring real-time analytics and geolocation tracking.

## 🚀 Live Demo

**[https://geckolink-demo.com](https://geckolink-demo.com)** _(Placeholder)_

---

## 🛠 Tech Stack

We utilize a modern, reliable stack aligned with high-throughput requirements:

- **Backend:** Ruby 3.4.8, Rails 7.2.3 (API Mode)
- **Database:** PostgreSQL 16 (Primary data store)
- **Caching:** Redis 7 (Rails cache store for redirects)
- **Frontend:** React 18 (via Vite), Tailwind CSS
- **Testing:** RSpec, FactoryBot, Faker
- **Containerization:** Docker & Docker Compose

---

## 🏗 Architecture & Design Decisions

### 1. Domain Design

We utilize **Service Objects** and **Query Objects** to keep controllers skinny and business logic testable.

- `Shortener::CreateService`: Handles the generation logic and initial record creation.
- `Analytics::ReportQuery`: Specialized query object to aggregate click data, ensuring the database handles the heavy lifting for reports.

### 2. User-specific short URL list

- **Not logged in**: Short URLs are stored in the browser’s localStorage. The dashboard shows links from localStorage (fetched by keys from the API; only anonymous links are returned).
- **Logged in**: Links are associated with the user. The dashboard shows only that user’s links from the database (paginated). Sign up and log in return a Bearer token; the client stores it and sends it in the `Authorization` header so auth works cross-origin and on mobile.

### 3. Synchronous Processing

1.  **URL Title Fetching**: When a user submits a link, we fetch the page title (and favicon) synchronously with a 5s timeout and return the short URL plus title/icon in the same response. If the fetch fails or times out, the link is still created with null title/icon.
2.  **Geolocation**: On each redirect we record the click and resolve IP to location (Geocoder, e.g. ipinfo.io) synchronously with a 2s timeout so analytics have geolocation without running a background worker.

### 4. Scalability

- **Redirect lookups**: Key → URL is cached (Rails.cache) for 5 minutes to reduce DB load on redirects. In production, the cache uses Redis (`REDIS_URL` or optional `REDIS_CACHE_URL`) so it is shared across instances.
- **Write Strategy**: We utilize unique indexes on the `key` column to prevent race conditions at the database level.
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
    git clone https://github.com/joncms95/geckolink.git
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
    We use `foreman` to run Rails and the Vite dev server.

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
- **Env**: **Local:** optional `DATABASE_URL`, `REDIS_URL` (see `.env.example`). **Production/Docker:** required `SECRET_KEY_BASE`, `POSTGRES_PASSWORD`; optional `DISABLE_SSL_REDIRECT`, `CORS_ORIGINS`, `VITE_API_BASE`. See `.env.example` and `docs/DEPLOY.md`.
- **Build**: For a single dyno/instance, build the React client (`npm run build --prefix client`) and serve from `client/dist` or your CDN; or run API and frontend separately (e.g. frontend on Vercel) and set `VITE_API_BASE` and CORS via `CORS_ORIGINS` or the defaults in `config/initializers/cors.rb`.

The repo includes a production Dockerfile and `docs/DEPLOY.md` for Docker Compose on a single server.

---

## 🛡 Security

- **Input Sanitization**: All target URLs are validated against a strict regex scheme to prevent Javascript injection (`javascript:`) or local network scanning.
- **Rate Limiting**: `Rack::Attack` throttles requests per IP: link creation, redirects, signup, and session (login) to limit abuse and brute force.

## 📝 License

MIT
