class ApplicationController < ActionController::API
  include ActionController::Cookies

  rescue_from ActionController::ParameterMissing do |e|
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end

  def current_user
    return nil unless session[:user_id]

    user = User.find_by(id: session[:user_id])
    return nil unless user

    # One-time upgrade: old sessions (no token in cookie) get the current user token
    if session[:session_token].blank?
      user.update_column(:session_token, SecureRandom.urlsafe_base64(32)) if user.session_token.blank?
      session[:session_token] = user.session_token
      return @current_user = user
    end

    # New sessions: token must match (log in on another device invalidates this one)
    if user.session_token.blank? || session[:session_token] != user.session_token
      reset_session
      return nil
    end

    @current_user = user
  end

  def signed_in?
    current_user.present?
  end
end
