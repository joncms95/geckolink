# frozen_string_literal: true

module Redirect
  # Resolves a key to its target URL, using a read-through cache.
  # Returns a Result with { link_id:, url: } on success (url = target URL for redirect).
  class ResolveService
    CACHE_TTL = 5.minutes

    def call(key:)
      cached = Rails.cache.read(cache_key(key))
      if cached
        return Result.success(link_id: cached["link_id"], url: cached["url"])
      end

      link = Link.find_by(key: key)
      return Result.failure("Link not found") unless link

      payload = { "link_id" => link.id, "url" => link.target_url }
      Rails.cache.write(cache_key(key), payload, expires_in: CACHE_TTL)

      Result.success(link_id: link.id, url: link.target_url)
    end

    private

    def cache_key(key)
      "redirect/#{key}"
    end
  end
end
