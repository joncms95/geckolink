# frozen_string_literal: true

module Api
  module RenderErrors
    extend ActiveSupport::Concern

    # Renders a consistent JSON error shape for all API controllers.
    # @param messages [Array<String>, String] error message(s)
    # @param status [Symbol, Integer] HTTP status (e.g. :unprocessable_content, :not_found)
    def render_errors(messages, status)
      errors = Array(messages).compact
      errors = ["Unknown error"] if errors.empty?

      render json: { errors: errors }, status: status
    end
  end
end
