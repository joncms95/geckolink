# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Registrations", type: :request do
  describe "POST /api/v1/signup" do
    it "creates user and returns 201 with token" do
      post api_v1_registrations_path, params: {
        user: { email: "new@example.com", password: "password123", password_confirmation: "password123" }
      }, as: :json
      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["user"]["email"]).to eq("new@example.com")
      expect(json["token"]).to be_present
      expect(User.find_by(email: "new@example.com")).to be_present
    end

    it "returns 422 for invalid email" do
      post api_v1_registrations_path, params: {
        user: { email: "invalid", password: "password123", password_confirmation: "password123" }
      }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "returns 422 when password confirmation does not match" do
      post api_v1_registrations_path, params: {
        user: { email: "new@example.com", password: "password123", password_confirmation: "other" }
      }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
