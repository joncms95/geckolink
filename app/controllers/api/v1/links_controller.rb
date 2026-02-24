# frozen_string_literal: true

module Api
  module V1
    class LinksController < ApplicationController
      DEFAULT_PER_PAGE = 10
      ALLOWED_SORTS = {
        "created_at_desc" => { created_at: :desc, id: :desc },
        "created_at_asc" => { created_at: :asc, id: :asc },
        "clicks_count_desc" => { clicks_count: :desc, id: :desc },
        "clicks_count_asc" => { clicks_count: :asc, id: :asc }
      }.freeze
      DEFAULT_ORDER = ALLOWED_SORTS["created_at_desc"].freeze

      before_action :require_authentication!, only: :index

      def create
        if stale_auth?
          return head :unauthorized
        end

        result = Shortener::CreateService.new.call(
          original_url: link_params[:target_url],
          user_id: current_user&.id
        )

        if result.success?
          Dashboard::StatsQuery.invalidate_for_user(current_user&.id)
          render json: link_json(result.value), status: :created
        else
          render json: { errors: result.error }, status: :unprocessable_content
        end
      end

      def index
        page = [ params[:page].to_i, 1 ].max
        per_page = DEFAULT_PER_PAGE
        scope = current_user.links.order(links_scope_order)
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
        authorize_link_access!(link) or return
        render json: link_json(link)
      end

      def analytics
        link = Link.find_by!(key: params[:key])
        authorize_link_access!(link) or return

        report = Analytics::ReportQuery.new(link: link).call
        render json: report
      end

      private

      def authorize_link_access!(link)
        return true if link.user_id.nil?
        return true if link.user_id == current_user&.id

        render json: { errors: [ "You don't have permission to view this link." ] }, status: :forbidden
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
          short_url: short_url_for(link)
        }
      end

      def short_url_for(link)
        "#{request.base_url}/#{link.key}"
      end

      def links_scope_order
        ALLOWED_SORTS.fetch(params[:sort].to_s, DEFAULT_ORDER)
      end
    end
  end
end
