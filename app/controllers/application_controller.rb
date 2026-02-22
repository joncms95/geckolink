class ApplicationController < ActionController::API
  include ActionController::Cookies

  rescue_from ActionController::ParameterMissing do |e|
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def signed_in?
    current_user.present?
  end
end
