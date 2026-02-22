# frozen_string_literal: true

module Analytics
  # Records a visit for a link and fills geolocation synchronously (with timeout).
  class RecordVisit
    GEOCODE_TIMEOUT_SEC = 2

    def self.call(link_id:, ip_address:, user_agent:)
      new.call(link_id: link_id, ip_address: ip_address, user_agent: user_agent)
    end

    def call(link_id:, ip_address:, user_agent:)
      link = Link.find_by(id: link_id)
      return unless link

      visit = link.visits.create!(
        ip_address: ip_address.presence,
        user_agent: user_agent.presence&.slice(0, 1024),
        visited_at: Time.current
      )
      fill_geolocation(visit)
      visit
    end

    private

    def fill_geolocation(visit)
      return if visit.ip_address.blank?
      return if visit.ip_address == "127.0.0.1" || visit.ip_address == "::1"

      result = Timeout.timeout(GEOCODE_TIMEOUT_SEC) do
        Geocoder.search(visit.ip_address).first
      end
      return unless result

      geolocation = [ result.city, result.country ].compact.join(", ")
      visit.update_columns(
        geolocation: geolocation.presence,
        country: result.country.to_s.presence
      )
    rescue Timeout::Error
      # Leave geolocation/country null
    end
  end
end
