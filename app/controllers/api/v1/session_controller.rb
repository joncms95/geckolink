# frozen_string_literal: true

module Api
  module V1
    class SessionController < Api::BaseController
      def create
        user = User.find_by(email: session_params[:email]&.downcase&.strip)

        unless user&.authenticate(session_params[:password])
          return render_errors("Invalid email or password", :unprocessable_content)
        end

        token = start_session(user)
        render json: { user: { email: user.email }, token: token }
      end

      def destroy
        end_session
        head :no_content
      end

      private

      def session_params
        params.require(:session).permit(:email, :password)
      end
    end
  end
end
