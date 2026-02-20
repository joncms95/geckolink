# frozen_string_literal: true

module Analytics
  class ReportQuery
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
        .transform_keys { |k| time_key_to_iso8601(k) }
    end

    def time_key_to_iso8601(k)
      case k
      when Time, ActiveSupport::TimeWithZone
        k.utc.iso8601(3)
      when String
        # PostgreSQL timestamps may not include timezone; parse as UTC for consistent JS Date parsing
        parsed = k.match?(/Z\z|[-+]\d{2}:?\d{2}\z/) ? Time.zone.parse(k) : Time.parse("#{k} UTC")
        parsed.utc.iso8601(3)
      else
        k.to_s
      end
    rescue ArgumentError, TypeError
      k.to_s
    end

    def call
      {
        by_country: by_country,
        by_hour: by_hour,
        visits: visits_for_report
      }
    end

    MAX_VISITS_IN_REPORT = 200

    def visits_for_report
      @link.visits
        .order(visited_at: :desc)
        .limit(MAX_VISITS_IN_REPORT)
        .pluck(:visited_at, :country, :geolocation)
        .map { |visited_at, country, geolocation|
          {
            visited_at: visited_at&.utc&.iso8601(3),
            country: country.to_s.presence,
            geolocation: geolocation.to_s.presence
          }
        }
    end
  end
end
