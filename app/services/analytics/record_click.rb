# frozen_string_literal: true

module Analytics
  class RecordClick
    GEOCODE_TIMEOUT_SEC = 3

    def self.call(link_id:, ip_address:, user_agent:, link: nil)
      new.call(link_id: link_id, ip_address: ip_address, user_agent: user_agent, link: link)
    end

    def call(link_id:, ip_address:, user_agent:, link: nil)
      link = link.presence || Link.find_by(id: link_id)
      return unless link

      click = link.clicks.create!(
        ip_address: ip_address.presence,
        user_agent: user_agent.presence&.slice(0, 1024),
        clicked_at: Time.current
      )

      fill_geolocation(click)
      invalidate_dashboard_cache_for(link)

      click
    end

    private

    def invalidate_dashboard_cache_for(link)
      return if link.user_id.blank?

      Dashboard::StatsQuery.invalidate_for_user(link.user_id)
    end

    def fill_geolocation(click)
      return if click.ip_address.blank?
      return if click.ip_address == "127.0.0.1" || click.ip_address == "::1"

      result = Timeout.timeout(GEOCODE_TIMEOUT_SEC) do
        Geocoder.search(click.ip_address).first
      end
      return unless result

      geolocation = [result.city, result.country].compact.join(", ")
      click.update_columns(
        geolocation: geolocation.presence,
        country: result.country.to_s.presence
      )
    rescue Timeout::Error
      # Leave geolocation/country null
    end
  end
end
