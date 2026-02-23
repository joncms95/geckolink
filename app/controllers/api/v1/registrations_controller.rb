# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        user = User.new(registration_params)

        unless user.save
          return render json: { errors: user.errors.full_messages }, status: :unprocessable_content
        end

        start_session(user)
        render json: { user: { email: user.email } }, status: :created
      end

      private

      def registration_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end
