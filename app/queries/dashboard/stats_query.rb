# frozen_string_literal: true

module Dashboard
  # Cached dashboard stats per user (TTL 2 min). Invalidated on link create and on click.
  class StatsQuery
    CACHE_TTL = 2.minutes
    CACHE_KEY_PREFIX = "dashboard_stats"

    def self.call(user)
      Rails.cache.fetch(cache_key(user.id), expires_in: CACHE_TTL) do
        compute(user)
      end
    end

    def self.cache_key(user_id)
      "#{CACHE_KEY_PREFIX}:#{user_id}"
    end

    def self.invalidate_for_user(user_id)
      return if user_id.blank?
      Rails.cache.delete(cache_key(user_id))
    end

    class << self
      private

      def compute(user)
        scope = user.links
        {
          total_links: scope.count,
          total_clicks: scope.sum(:clicks_count),
          top_location: top_location_for_user(user)
        }
      end

      def top_location_for_user(user)
        pair = Click
          .where(link_id: user.links.select(:id))
          .where.not(country: [nil, ""])
          .group(:country)
          .count
          .max_by { |_, count| count }
        pair&.first&.to_s.presence
      end
    end
  end
end
