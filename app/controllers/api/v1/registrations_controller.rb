# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        user = User.new(registration_params)
        if user.save
          session[:user_id] = user.id
          session[:session_token] = UserSession.create_for_user(user)
          render json: { user: { id: user.id, email: user.email } }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def registration_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end
