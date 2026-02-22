# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Session", type: :request do
  let(:user) { create(:user, email: "auth@example.com", password: "password123", password_confirmation: "password123") }

  describe "POST /api/v1/session (login)" do
    it "returns 401 for wrong password" do
      post api_v1_session_path, params: { session: { email: user.email, password: "wrong" } }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "creates session and returns user for valid credentials" do
      post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["user"]["id"]).to eq(user.id)
      expect(response.parsed_body["user"]["email"]).to eq(user.email)
    end
  end

  describe "DELETE /api/v1/session (logout)" do
    it "clears session and returns no content" do
      post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      delete api_v1_session_path
      expect(response).to have_http_status(:no_content)
    end
  end
end
