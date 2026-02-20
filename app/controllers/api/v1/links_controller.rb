# frozen_string_literal: true

module Api
  module V1
    class LinksController < ApplicationController
      def create
        result = Shortener::CreateService.new.call(original_url: link_params[:url])
        if result.success?
          render json: link_json(result.value), status: :created
        else
          render json: { errors: result.error }, status: :unprocessable_content
        end
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
