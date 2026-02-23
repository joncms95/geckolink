# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Dashboard", type: :request do
  describe "GET /api/v1/dashboard/stats" do
    it "returns 401 when not authenticated" do
      get "/api/v1/dashboard/stats"
      expect(response).to have_http_status(:unauthorized)
    end

    context "when authenticated" do
      let(:user) { create(:user) }
      let(:auth_headers) do
        post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
        token = response.parsed_body["token"]
        reset!
        { "Authorization" => "Bearer #{token}" }
      end

      it "returns stats for user with no links" do
        get "/api/v1/dashboard/stats", headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total_links"]).to eq(0)
        expect(json["total_clicks"]).to eq(0)
        expect(json["top_location"]).to be_nil
      end

      it "returns total_clicks and top_location across all user links" do
        link1 = create(:link, user_id: user.id, clicks_count: 3)
        link2 = create(:link, user_id: user.id, clicks_count: 2)
        create(:click, link: link1, country: "MY")
        create(:click, link: link1, country: "MY")
        create(:click, link: link2, country: "MY")
        create(:click, link: link2, country: "US")

        get "/api/v1/dashboard/stats", headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total_links"]).to eq(2)
        expect(json["total_clicks"]).to eq(5)
        expect(json["top_location"]).to eq("MY")
      end
    end
  end
end
