# frozen_string_literal: true

# Session is created only on login (create) and cleared only on logout (destroy).
# The user stays logged in for the lifetime of the session cookie until they log out.
# No "check session" endpoint — auth is inferred from the cookie on each request.
module Api
  module V1
    class SessionController < ApplicationController
      def create
        user = User.find_by(email: session_params[:email]&.downcase&.strip)
        if user&.authenticate(session_params[:password])
          reset_session
          session[:user_id] = user.id
          render json: { user: user_json(user) }
        else
          render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
        end
      end

      def destroy
        reset_session
        head :no_content
      end

      private

      def session_params
        params.require(:session).permit(:email, :password)
      end

      def user_json(user)
        { id: user.id, email: user.email }
      end
    end
  end
end
