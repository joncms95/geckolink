# frozen_string_literal: true

module Dashboard
  # Returns dashboard aggregates (total_links, total_clicks, top_location) for a user.
  # Uses Rails.cache to avoid heavy queries on every index request when the user has
  # many links (e.g. scope.count, sum(:clicks_count), and Click.group(:country) over
  # all user links can be very slow at scale).
  #
  # Cache key: dashboard_stats:#{user_id}, TTL: 2 minutes.
  # Invalidated when the user creates a link (so total_links is correct) and when
  # a click is recorded on any of their links (so total_clicks and top_location stay fresh).
  #
  # For very large scale (e.g. millions of links per user), consider a precomputed
  # stats table updated incrementally (e.g. on link create/destroy and on click with
  # country), so the dashboard reads a single row instead of scanning links/clicks.
  class StatsQuery
    CACHE_TTL = 2.minutes
    CACHE_KEY_PREFIX = "dashboard_stats"

    def self.call(user)
      Rails.cache.fetch(cache_key(user.id), expires_in: CACHE_TTL) do
        new(user).compute
      end
    end

    def self.invalidate_for_user(user_id)
      return if user_id.blank?
      Rails.cache.delete(cache_key(user_id))
    end

    def self.cache_key(user_id)
      "#{CACHE_KEY_PREFIX}:#{user_id}"
    end

    def initialize(user)
      @user = user
    end

    def compute
      scope = @user.links
      total_links = scope.count
      total_clicks = scope.sum(:clicks_count)
      top_location = top_location_for_user
      {
        total_links: total_links,
        total_clicks: total_clicks,
        top_location: top_location
      }
    end

    private

    def top_location_for_user
      pair = Click
        .where(link_id: @user.links.select(:id))
        .where.not(country: [nil, ""])
        .group(:country)
        .count
        .max_by { |_, count| count }
      pair&.first&.to_s.presence
    end
  end
end
