# frozen_string_literal: true

module Api
  module V1
    class LinksController < ApplicationController
      DEFAULT_PER_PAGE = 10
      MAX_PER_PAGE = 50
      BATCH_MAX = 100

      def create
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

      # Logged-in user only: list links for current user, ordered by created_at desc.
      def my_index
        return head :unauthorized unless signed_in?

        page, per_page = pagination_params
        scope = current_user.links.order(created_at: :desc, id: :desc)
        total = scope.count
        links = scope.offset((page - 1) * per_page).limit(per_page).to_a
        render json: { links: links.map { |l| link_json(l) }, total: total }
      end

      # Anonymous lookup by short_codes (e.g. other clients). Dashboard for non-login uses localStorage only.
      def index
        codes = params[:short_codes].to_s.split(",").map(&:strip).reject(&:empty?).uniq.first(BATCH_MAX)
        if codes.empty?
          return render json: { links: [], total: 0 }
        end

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
        render json: link_json(link)
      end

      def analytics
        link = Link.find_by!(short_code: params[:short_code])
        report = Analytics::ReportQuery.new(link: link).call
        render json: report
      end

      private

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
          id: link.id,
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
