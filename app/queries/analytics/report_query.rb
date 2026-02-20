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
        .transform_keys { |k| k.is_a?(Time) ? k.utc.iso8601(3) : k.to_s }
    end

    def call
      { by_country: by_country, by_hour: by_hour }
    end
  end
end
