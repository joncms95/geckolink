# frozen_string_literal: true

# Shared authentication for all controllers.
# Uses only Authorization: Bearer <token> — no cookies. Works cross-origin and on mobile.
module Authentication
  extend ActiveSupport::Concern

  included do
    helper_method :current_user, :signed_in? if respond_to?(:helper_method)
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = authenticate_from_token
  end

  def signed_in?
    current_user.present?
  end

  def require_authentication!
    head :unauthorized unless signed_in?
  end

  # True when the request sends a Bearer token but it resolved to no user (stale/revoked).
  def stale_auth?
    bearer_present? && current_user.nil?
  end

  # Create a new Session for the user and return the token for the client.
  def start_session(user)
    Session.create_for_user(user)
  end

  # Destroy the Session for the token in the request (if any).
  def end_session
    Session.find_by(token: bearer_token)&.destroy if bearer_present?
  end

  def authenticate_from_token
    return unless bearer_present?

    Session.find_by(token: bearer_token)&.user
  end

  def bearer_present?
    request.headers["Authorization"]&.start_with?("Bearer ")
  end

  def bearer_token
    request.headers["Authorization"]&.split(" ", 2)&.last
  end
end
