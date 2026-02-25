# frozen_string_literal: true

module Api
  class BaseController < ApplicationController
    include Api::Authentication
    include Api::RenderErrors

    rescue_from ActionController::ParameterMissing do |e|
      render_errors(e.message, :unprocessable_content)
    end

    rescue_from ActiveRecord::RecordNotFound do
      render_errors("Not found.", :not_found)
    end
  end
end
