# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Session", type: :request do
  let(:user) { create(:user, email: "auth@example.com", password: "password123", password_confirmation: "password123") }

  describe "POST /api/v1/session (login)" do
    it "returns 401 for wrong password" do
      post api_v1_session_path, params: { session: { email: user.email, password: "wrong" } }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "creates session and returns user with token for valid credentials" do
      post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["user"]["email"]).to eq(user.email)
      expect(json["token"]).to be_present
    end
  end

  describe "DELETE /api/v1/session (logout)" do
    it "returns no content when no token (client already cleared)" do
      delete api_v1_session_path
      expect(response).to have_http_status(:no_content)
    end

    it "destroys session and returns no content when Bearer token sent" do
      post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      token = response.parsed_body["token"]

      reset!

      delete api_v1_session_path, headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:no_content)
      expect(UserSession.find_by(token: token)).to be_nil
    end
  end

  describe "Bearer token authentication" do
    it "authenticates requests using Authorization header" do
      post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      token = response.parsed_body["token"]

      reset!

      get "/api/v1/me/links", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
    end

    it "returns 401 for invalid Bearer token on protected routes" do
      get "/api/v1/me/links", headers: { "Authorization" => "Bearer invalid_token" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
