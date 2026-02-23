class ApplicationController < ActionController::API
  include ActionController::Cookies

  rescue_from ActionController::ParameterMissing do |e|
    render json: { errors: [ e.message ] }, status: :unprocessable_content
  end

  def current_user
    return nil if session[:session_token].blank?

    user_session = UserSession.find_by(token: session[:session_token])
    unless user_session
      reset_session
      return nil
    end

    @current_user = user_session.user
  end

  def signed_in?
    current_user.present?
  end
end
