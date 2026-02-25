# frozen_string_literal: true

module Api
  module V1
    class DashboardController < Api::BaseController
      before_action :require_authentication!

      def stats
        stats = Dashboard::StatsQuery.call(current_user)

        render json: {
          total_links: stats[:total_links],
          total_clicks: stats[:total_clicks],
          top_location: stats[:top_location]
        }
      end
    end
  end
end
