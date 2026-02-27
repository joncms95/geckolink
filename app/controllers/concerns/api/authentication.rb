# frozen_string_literal: true

module Api
  # Bearer-token authentication for API controllers.
  # Uses only Authorization: Bearer <token> — no cookies. Works cross-origin and on mobile.
  module Authentication
    extend ActiveSupport::Concern

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
      Session.create_token_for_user(user)
    end

    # Destroy the Session for the token in the request (if any).
    def end_session
      Session.find_by_token(bearer_token)&.destroy if bearer_present?
    end

    def authenticate_from_token
      return unless bearer_present?

      Session.find_by_token(bearer_token)&.user
    end

    def bearer_present?
      request.headers["Authorization"]&.start_with?("Bearer ")
    end

    def bearer_token
      request.headers["Authorization"]&.split(" ", 2)&.last&.presence
    end
  end
end
