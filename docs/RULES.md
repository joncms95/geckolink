# Code Standards & Instructions

You are acting as a Senior Ruby on Rails Engineer. Follow these rules strictly when generating code for the GeckoLink project.

## 1. Tech Stack Constraints

- **Ruby**: v3.4.8 (Use modern syntax: pattern matching, endless methods where appropriate).
- **Rails**: v7.2.3 (Leverage ActiveRecord improvements).
- **Frontend**: React + Tailwind CSS.
- **Testing**: RSpec, FactoryBot, Faker.

## 2. Architectural Patterns

- **Service Objects**: ALL complex business logic goes into `app/services`.
  - _Naming_: `Namespace::ActionService` (e.g., `Links::ShortenService`).
  - _Interface_: Use a standard `call` method. Return a `Result` object (Success/Failure), do not raise exceptions for expected flow control.
- **Query Objects**: Complex SQL queries or aggregations go into `app/queries`.
- **Slim Controllers**: Controllers should only handle parameter parsing, calling a service, and rendering the response.
- **Fat Models**: Avoid them. Keep models strictly for associations, scopes, and simple validations.

## 3. Testing Guidelines

- **TDD**: Write the spec _before_ the implementation.
- **Integration**: Request specs (`spec/requests`) are preferred over controller specs.
- **Factories**: Use FactoryBot for all test data. Never hardcode data in tests.
- **Coverage**: 100% coverage on Service Objects is mandatory.

## 4. Coding Style

- **Rubocop**: Adhere to standard Rails style guide.
- **Tailwind**: Use utility classes. Do not create custom CSS files unless absolutely necessary.
- **React**: Functional components with Hooks only.

## 5. Security & Robustness

- **Strong Parameters**: Always use strong params in controllers.
- **N+1 Queries**: Detect and fix them proactively using `includes`.
- **Validations**: validate strict URL patterns (must include scheme http/https).
