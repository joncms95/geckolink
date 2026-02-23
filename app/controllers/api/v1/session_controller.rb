# frozen_string_literal: true

module Api
  module V1
    class SessionController < ApplicationController
      def create
        user = User.find_by(email: session_params[:email]&.downcase&.strip)

        unless user&.authenticate(session_params[:password])
          return render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
        end

        token = start_session(user)
        render json: { user: user_json(user), token: token }
      end

      def destroy
        end_session
        head :no_content
      end

      private

      def session_params
        params.require(:session).permit(:email, :password)
      end

      def user_json(user)
        { email: user.email }
      end
    end
  end
end
