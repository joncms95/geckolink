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

      def index
        page = [ params[:page].to_i, 1 ].max
        per_page = [ [ params[:per_page].to_i, 1 ].max, MAX_PER_PAGE ].min
        per_page = DEFAULT_PER_PAGE if per_page.zero?

        if signed_in?
          scope = Link.where(user_id: current_user.id).order(created_at: :desc)
          total = scope.count
          links = scope.offset((page - 1) * per_page).limit(per_page)
        else
          codes = params[:short_codes].to_s.split(",").map(&:strip).reject(&:empty?).uniq.first(BATCH_MAX)
          total = codes.size
          slice = codes[(page - 1) * per_page, per_page]
          if slice.blank?
            links = []
          else
            by_code = Link.where(short_code: slice, user_id: nil).index_by(&:short_code)
            links = slice.filter_map { |c| by_code[c] }
          end
        end

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
