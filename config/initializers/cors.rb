# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.
# Set CORS_ORIGINS to a comma-separated list of allowed origins (no spaces).
# Read more: https://github.com/cyu/rack-cors

default_origins = %w[
  https://geckolink.vercel.app
  http://localhost:5173
]
cors_origins = ENV.fetch("CORS_ORIGINS", default_origins.join(",")).split(",").map(&:strip).reject(&:empty?)
cors_origins = default_origins if cors_origins.empty?

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*cors_origins)
    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
