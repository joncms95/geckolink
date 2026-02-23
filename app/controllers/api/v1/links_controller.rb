# frozen_string_literal: true

module Api
  module V1
    class LinksController < ApplicationController
      DEFAULT_PER_PAGE = 10
      MAX_PER_PAGE = 50
      BATCH_MAX = 100

      before_action :require_authentication!, only: :my_index

      def create
        # Stale credential (revoked token or cookie) → 401 so client clears auth state.
        if stale_auth?
          return head :unauthorized
        end

        result = Shortener::CreateService.new.call(
          original_url: link_params[:url],
          user_id: current_user&.id
        )

        if result.success?
          render json: link_json(result.value), status: :created
        else
          render json: { errors: result.error }, status: :unprocessable_content
        end
      end

      def my_index
        page, per_page = pagination_params
        scope = current_user.links.order(created_at: :desc, id: :desc)
        total = scope.count
        links = scope.offset((page - 1) * per_page).limit(per_page).to_a

        render json: { links: links.map { |l| link_json(l) }, total: total }
      end

      def index
        codes = params[:short_codes].to_s.split(",").map(&:strip).reject(&:empty?).uniq.first(BATCH_MAX)
        return render(json: { links: [], total: 0 }) if codes.empty?

        page, per_page = pagination_params
        all_links = Link.where(short_code: codes, user_id: nil).to_a
        code_order = codes.each_with_index.to_h
        sorted = all_links.sort_by { |l| code_order[l.short_code] || codes.size }
        total = sorted.size
        links = sorted[(page - 1) * per_page, per_page] || []

        render json: { links: links.map { |l| link_json(l) }, total: total }
      end

      def show
        link = Link.find_by!(short_code: params[:short_code])
        authorize_link_access!(link) or return
        render json: link_json(link)
      end

      def analytics
        link = Link.find_by!(short_code: params[:short_code])
        authorize_link_access!(link) or return

        report = Analytics::ReportQuery.new(link: link).call
        render json: report
      end

      private

      # Anonymous links (no user_id) are public; owned links require the owner.
      def authorize_link_access!(link)
        return true if link.user_id.nil?
        return true if link.user_id == current_user&.id

        head :forbidden
        false
      end

      def pagination_params
        page = [ params[:page].to_i, 1 ].max
        per_page = [ [ params[:per_page].to_i, 1 ].max, MAX_PER_PAGE ].min
        per_page = DEFAULT_PER_PAGE if per_page.zero?
        [ page, per_page ]
      end

      def link_params
        params.require(:link).permit(:url)
      end

      def link_json(link)
        {
          url: link.url,
          short_code: link.short_code,
          title: link.title,
          icon_url: link.icon_url,
          clicks_count: link.clicks_count,
          short_url: short_url_for(link)
        }
      end

      def short_url_for(link)
        "#{request.base_url}/#{link.short_code}"
      end
    end
  end
end
