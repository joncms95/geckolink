# frozen_string_literal: true

module Redirect
  # Resolves a short code to its target URL, using a read-through cache.
  # Returns a Result with { link_id:, url: } on success.
  class ResolveService
    CACHE_TTL = 5.minutes

    def call(short_code:)
      cached = Rails.cache.read(cache_key(short_code))
      if cached
        return Result.success(link_id: cached["link_id"], url: cached["url"])
      end

      link = Link.find_by(short_code: short_code)
      return Result.failure("Short link not found") unless link

      payload = { "link_id" => link.id, "url" => link.url }
      Rails.cache.write(cache_key(short_code), payload, expires_in: CACHE_TTL)

      Result.success(link_id: link.id, url: link.url)
    end

    private

    def cache_key(short_code)
      "redirect/#{short_code}"
    end
  end
end
