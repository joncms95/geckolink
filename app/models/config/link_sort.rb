# frozen_string_literal: true

module Config
  class LinkSort
    DEFAULT_PER_PAGE = 10

    ALLOWED_SORTS = {
      "newest" => { created_at: :desc, id: :desc },
      "oldest" => { created_at: :asc, id: :asc },
      "most_clicks" => { clicks_count: :desc, id: :desc },
      "least_clicks" => { clicks_count: :asc, id: :asc }
    }.freeze

    DEFAULT_ORDER = ALLOWED_SORTS["newest"].freeze

    def self.order_for(sort_param)
      ALLOWED_SORTS.fetch(sort_param.to_s.presence, DEFAULT_ORDER)
    end
  end
end
