# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Authentication

  rescue_from ActionController::ParameterMissing do |e|
    render json: { errors: [ e.message ] }, status: :unprocessable_content
  end

  rescue_from ActiveRecord::RecordNotFound do
    render json: { errors: [ "Not found." ] }, status: :not_found
  end
end
