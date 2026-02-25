# frozen_string_literal: true

module Analytics
  class ReportQuery
    MAX_CLICKS_IN_REPORT = 200

    def self.call(link:)
      countries = by_country(link)
      {
        by_country: countries,
        by_hour: by_hour(link),
        clicks: clicks_for_report(link),
        clicks_count: link.clicks_count,
        top_location: top_location(countries)
      }
    end

    class << self
      private

      def by_country(link)
        link.clicks
            .where.not(country: nil)
            .group(:country)
            .count
            .transform_keys(&:to_s)
      end

      def by_hour(link)
        link.clicks
            .group(Arel.sql("date_trunc('hour', clicked_at)"))
            .order(Arel.sql("date_trunc('hour', clicked_at)"))
            .count
            .transform_keys { |k| utc_to_iso8601(k) }
      end

      def top_location(countries)
        return nil if countries.blank?
        countries.max_by { |_country, count| count }&.first
      end

      def clicks_for_report(link)
        link.clicks
            .order(clicked_at: :desc)
            .limit(MAX_CLICKS_IN_REPORT)
            .pluck(:clicked_at, :country, :geolocation, :user_agent)
            .map { |clicked_at, country, geolocation, user_agent|
              {
                clicked_at: utc_to_iso8601(clicked_at),
                country: country.presence,
                geolocation: geolocation.presence,
                user_agent: user_agent.presence
              }
            }
      end

      def utc_to_iso8601(value)
        value.utc.iso8601(3)
      end
    end
  end
end
