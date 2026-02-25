# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < Api::BaseController
      def create
        user = User.new(registration_params)

        unless user.save
          return render_errors(user.errors.full_messages, :unprocessable_content)
        end

        token = start_session(user)
        render json: { user: { email: user.email }, token: token }, status: :created
      end

      private

      def registration_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end
