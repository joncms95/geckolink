# frozen_string_literal: true

module Analytics
  class ReportQuery
    MAX_CLICKS_IN_REPORT = 200

    def initialize(link:)
      @link = link
    end

    def by_country
      @link.clicks
        .where.not(country: nil)
        .group(:country)
        .count
        .transform_keys(&:to_s)
    end

    def by_hour
      @link.clicks
        .group(Arel.sql("date_trunc('hour', clicked_at)"))
        .order(Arel.sql("date_trunc('hour', clicked_at)"))
        .count
        .transform_keys { |k| format_time_iso8601(k) }
    end

    def call
      {
        by_country: by_country,
        by_hour: by_hour,
        clicks: clicks_for_report
      }
    end

    def clicks_for_report
      @link.clicks
        .order(clicked_at: :desc)
        .limit(MAX_CLICKS_IN_REPORT)
        .pluck(:clicked_at, :country, :geolocation)
        .map { |clicked_at, country, geolocation|
          {
            clicked_at: format_time_iso8601(clicked_at),
            country: country.to_s.presence,
            geolocation: geolocation.to_s.presence
          }
        }
    end

    private

    def format_time_iso8601(value)
      return nil if value.nil?
      case value
      when Time, ActiveSupport::TimeWithZone
        value.utc.iso8601(3)
      when String
        # PostgreSQL timestamps may not include timezone; parse as UTC for consistent JS Date parsing
        parsed = value.match?(/Z\z|[-+]\d{2}:?\d{2}\z/) ? Time.zone.parse(value) : Time.parse("#{value} UTC")
        parsed.utc.iso8601(3)
      else
        value.to_s
      end
    rescue ArgumentError, TypeError
      value.to_s
    end
  end
end
