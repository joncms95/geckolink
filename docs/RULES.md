# Code Standards & Instructions

You are acting as a Senior Ruby on Rails Engineer. Follow these rules strictly when generating code for the GeckoLink project.

## 1. Tech Stack Constraints

- **Ruby**: v3.4.8 (use modern syntax: pattern matching, endless methods where appropriate).
- **Rails**: v7.2.3, API-only mode.
- **Frontend**: React 18 (Vite) + Tailwind CSS + React Router 7.
- **Testing**: RSpec, FactoryBot, Faker, WebMock.

## 2. Architectural Patterns

- **Service Objects**: All complex business logic goes into `app/services/`.
  - _Naming_: `Namespace::ActionService` (e.g., `Shortener::CreateService`).
  - _Interface_: A single `call` method. Return a `Result` object (`Result.success(value)` / `Result.failure(error)`) — never raise exceptions for expected flow control.
- **Query Objects**: Complex SQL aggregations go into `app/queries/` (e.g., `Analytics::ReportQuery`).
- **Concerns**: Shared controller behaviour in `app/controllers/concerns/` (e.g., `Authentication` for token-based auth).
- **Slim Controllers**: Controllers handle parameter parsing, call a service or query, and render the response. No business logic in controllers.
- **Lean Models**: Keep models to associations, scopes, simple validations, and callbacks. Move multi-step logic to services.

## 3. Authentication

- Bearer-token auth via the `Authentication` concern (included in `ApplicationController`).
- Tokens are stored in the `sessions` table; validate on each authenticated request.
- Use `require_authentication!` as a `before_action` for endpoints that require a logged-in user.
- Use `current_user` and `signed_in?` for optional auth.

## 4. Testing Guidelines

- **TDD**: Write the spec before the implementation.
- **Integration**: Request specs (`spec/requests/`) are preferred over controller specs.
- **Factories**: Use FactoryBot for all test data. Never hardcode data in tests.
- **Coverage**: 100% coverage on service objects and query objects is mandatory.
- **External HTTP**: Stub all outbound HTTP with WebMock.

## 5. Coding Style

- **Rubocop**: Adhere to Rails Omakase style guide (`.rubocop.yml`).
- **Tailwind**: Use utility classes. Do not create custom CSS files unless absolutely necessary.
- **React**: Functional components with hooks only. Custom hooks in `client/src/hooks/`.

## 6. Security & Robustness

- **Strong Parameters**: Always use strong params in controllers.
- **N+1 Queries**: Detect and fix proactively using `includes`.
- **URL Validation**: Strict scheme check (`http`/`https` only), private-host blocking.
- **Rate Limiting**: `Rack::Attack` throttles per IP for all public endpoints.
