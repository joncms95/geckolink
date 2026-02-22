# frozen_string_literal: true

Rack::Attack.cache.store = Rails.cache

# Must match route constraint in config/routes.rb (short_code: /[0-9a-zA-Z]+/)
REDIRECT_PATH_REGEX = %r{\A/[0-9a-zA-Z]+\z}

Rack::Attack.throttle("links/create", limit: 30, period: 1.minute) do |req|
  req.ip if req.post? && req.path == "/api/v1/links"
end

Rack::Attack.throttle("redirects", limit: 300, period: 1.minute) do |req|
  req.ip if req.get? && req.path.match?(REDIRECT_PATH_REGEX) && req.path != "/up"
end

Rack::Attack.throttle("signup", limit: 10, period: 1.hour) do |req|
  req.ip if req.post? && req.path == "/api/v1/signup"
end

Rack::Attack.throttle("session/create", limit: 20, period: 5.minutes) do |req|
  req.ip if req.post? && req.path == "/api/v1/session"
end
