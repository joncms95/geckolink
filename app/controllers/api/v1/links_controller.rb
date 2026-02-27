# frozen_string_literal: true

module Api
  module V1
    class LinksController < Api::BaseController
      before_action :require_authentication!, only: %i[index show analytics]

      def create
        return head :unauthorized if stale_auth?

        result = Shortener::CreateService.call(
          original_url: link_params[:target_url],
          user_id: current_user&.id
        )

        if result.success?
          Dashboard::StatsQuery.invalidate_for_user(current_user&.id)
          render json: link_json(result.value), status: :created
        else
          render_errors(result.error, :unprocessable_content)
        end
      end

      def index
        page = [params[:page].to_i, 1].max
        per_page = Config::LinkSort::DEFAULT_PER_PAGE
        scope = current_user.links.order(Config::LinkSort.order_for(params[:sort]))
        total = scope.count
        links = scope.offset((page - 1) * per_page).limit(per_page).to_a

        render json: {
          links: links.map { |link| link_json(link) },
          total: total,
          per_page: per_page
        }
      end

      def show
        link = Link.find_by!(key: params[:key])
        return unless authorize_link_access!(link)

        render json: link_json(link)
      end

      def analytics
        link = Link.find_by!(key: params[:key])
        return unless authorize_link_access!(link)

        report = Analytics::ReportQuery.call(link: link)
        render json: report
      end

      private

      def authorize_link_access!(link)
        return true if link.user_id == current_user&.id

        render_errors("You don't have permission to view this link.", :forbidden)
        false
      end

      def link_params
        params.require(:link).permit(:target_url)
      end

      def link_json(link)
        {
          target_url: link.target_url,
          key: link.key,
          title: link.title,
          icon_url: link.icon_url,
          clicks_count: link.clicks_count,
          short_url: "#{request.base_url}/#{link.key}"
        }
      end
    end
  end
end
