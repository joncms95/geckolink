# frozen_string_literal: true

Rack::Attack.cache.store = Rails.cache

Rack::Attack.throttle("links/create", limit: 30, period: 1.minute) do |req|
  req.ip if req.post? && req.path == "/api/v1/links"
end

Rack::Attack.throttle("redirects", limit: 300, period: 1.minute) do |req|
  req.ip if req.get? && req.path.match?(%r{\A/[0-9a-zA-Z]+\z}) && req.path != "/up"
end
