# frozen_string_literal: true

module Api
  module V1
    class SessionController < ApplicationController
      def show
        if signed_in?
          render json: { user: user_json(current_user) }
        else
          head :unauthorized
        end
      end

      def create
        user = User.find_by(email: session_params[:email]&.downcase&.strip)
        if user&.authenticate(session_params[:password])
          session[:user_id] = user.id
          render json: { user: user_json(user) }
        else
          render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
        end
      end

      def destroy
        session.delete(:user_id)
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
