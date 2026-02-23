# frozen_string_literal: true

# Shared session-based authentication for all controllers.
# Relies on UserSession token stored in the encrypted cookie session.
module Authentication
  extend ActiveSupport::Concern

  included do
    helper_method :current_user, :signed_in? if respond_to?(:helper_method)
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    token = session[:session_token]
    unless token.present?
      @current_user = nil
      return nil
    end

    user_session = UserSession.find_by(token: token)
    unless user_session
      reset_session
      @current_user = nil
      return nil
    end

    @current_user = user_session.user
  end

  def signed_in?
    current_user.present?
  end

  def require_authentication!
    head :unauthorized unless signed_in?
  end

  # Start a new session for the given user.
  # Resets the existing session first to prevent session fixation.
  def start_session(user)
    reset_session
    session[:user_id] = user.id
    session[:session_token] = UserSession.create_for_user(user)
  end

  # End the current session — destroys the server-side UserSession record.
  def end_session
    if session[:session_token].present?
      UserSession.find_by(token: session[:session_token])&.destroy
    end
    reset_session
  end
end
