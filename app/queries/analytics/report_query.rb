# frozen_string_literal: true

module Analytics
  class ReportQuery
    MAX_VISITS_IN_REPORT = 200

    def initialize(link:)
      @link = link
    end

    def by_country
      @link.visits
        .where.not(country: nil)
        .group(:country)
        .count
        .transform_keys(&:to_s)
    end

    def by_hour
      @link.visits
        .group(Arel.sql("date_trunc('hour', visited_at)"))
        .order(Arel.sql("date_trunc('hour', visited_at)"))
        .count
        .transform_keys { |k| format_time_iso8601(k) }
    end

    def call
      {
        by_country: by_country,
        by_hour: by_hour,
        visits: visits_for_report
      }
    end

    def visits_for_report
      @link.visits
        .order(visited_at: :desc)
        .limit(MAX_VISITS_IN_REPORT)
        .pluck(:visited_at, :country, :geolocation)
        .map { |visited_at, country, geolocation|
          {
            visited_at: format_time_iso8601(visited_at),
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
