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

1.  **URL Title Fetching**: When a user submits a link, we return the short URL immediately. A Sidekiq job (`FetchTitleJob`) runs in the background to scrape the HTML `<title>` tag and update the record via ActionCable/WebSockets or simple polling.
2.  **Geolocation**: Click analytics are processed asynchronously. When a link is visited, we log the raw event and process IP-to-Location (using GeoIP) in a background worker to avoid slowing down the redirect.

### 3. Scalability

- **Read-Heavy Optimization**: Short code lookups are cached in Redis to minimize DB hits on redirects.
- **Write Strategy**: We utilize unique indexes on the `short_code` column to prevent race conditions at the database level.

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

---

## 🛡 Security

- **Input Sanitization**: All target URLs are validated against a strict regex scheme to prevent Javascript injection (`javascript:`) or local network scanning.
- **Rate Limiting**: `Rack::Attack` is configured to throttle abusive IP addresses attempting to generate mass links.

## 📝 License

MIT
