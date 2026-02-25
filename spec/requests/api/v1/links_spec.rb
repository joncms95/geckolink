# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Links", type: :request do
  describe "POST /api/v1/links" do
    let(:valid_url) { "https://example.com/page" }
    let(:params) { { link: { target_url: valid_url } } }

    before do
      allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(nil)
    end

    it "creates a link and returns short URL" do
      post api_v1_links_path, params: params, as: :json
      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["target_url"]).to eq(valid_url)
      expect(json["key"]).to be_present
      expect(json["short_url"]).to include(json["key"])
      expect(json["clicks_count"]).to eq(0)
    end

    it "returns link with title and icon when fetch succeeds" do
      allow(Metadata::TitleAndIconFetcher).to receive(:call)
          .with(valid_url)
          .and_return({ title: "Example Page", icon_url: "https://example.com/favicon.ico" })
      post api_v1_links_path, params: params, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Example Page")
      expect(response.parsed_body["icon_url"]).to eq("https://example.com/favicon.ico")
    end

    it "returns link with null title when fetch returns null (timeout or failure)" do
      allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(nil)
      post api_v1_links_path, params: params, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to be_nil
    end

    context "with invalid URL" do
      it "returns 422 with errors" do
        post api_v1_links_path, params: { link: { target_url: "javascript:alert(1)" } }, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to be_present
      end
    end

    context "without link param" do
      it "returns 422 with errors" do
        post api_v1_links_path, params: {}, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to be_present
      end
    end
  end

  describe "GET /api/v1/links (index)" do
    it "returns 401 when not authenticated" do
      get api_v1_links_path, params: { page: 1 }
      expect(response).to have_http_status(:unauthorized)
    end

    context "when authenticated via Bearer token" do
      let(:user) { create(:user) }
      let(:auth_headers) do
        post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
        token = response.parsed_body["token"]
        reset!
        { "Authorization" => "Bearer #{token}" }
      end

      it "returns only current user links ordered by created_at desc" do
        other_user = create(:user)
        my_newer = create(:link, target_url: "https://my-newer.com", user_id: user.id)
        my_older = create(:link, target_url: "https://my-older.com", user_id: user.id)
        create(:link, target_url: "https://other.com", user_id: other_user.id)

        get api_v1_links_path, params: { page: 1 }, headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total"]).to eq(2)
        expect(json["links"].map { |l| l["key"] }).to contain_exactly(my_newer.key, my_older.key)
      end

      it "returns empty list when user has no links" do
        get api_v1_links_path, headers: auth_headers
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["links"]).to eq([])
        expect(response.parsed_body["total"]).to eq(0)
      end

      it "returns user links (token-only auth for mobile/cross-origin)" do
        create(:link, target_url: "https://my-link.com", user_id: user.id)

        get api_v1_links_path, headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total"]).to eq(1)
        expect(json["links"].first["target_url"]).to eq("https://my-link.com")
      end
    end
  end

  describe "GET /api/v1/links/:key" do
    let(:link) { create(:link) }

    it "returns the link" do
      get api_v1_link_path(link.key)
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["key"]).to eq(link.key)
      expect(json["target_url"]).to eq(link.target_url)
    end

    it "returns 404 for unknown key" do
      get api_v1_link_path("nonexistent")
      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body["errors"]).to eq(["Not found."])
    end

    it "returns 403 with message when link belongs to another user" do
      other_user = create(:user)
      other_link = create(:link, user_id: other_user.id)
      me = create(:user)
      post api_v1_session_path, params: { session: { email: me.email, password: "password123" } }, as: :json
      token = response.parsed_body["token"]
      reset!

      get api_v1_link_path(other_link.key), headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["errors"]).to eq(["You don't have permission to view this link."])
    end
  end

  describe "GET /api/v1/links/:key/analytics" do
    let(:link) { create(:link) }

    it "returns report with by_country and by_hour" do
      create(:click, link: link, country: "US")
      get analytics_api_v1_link_path(link.key)
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to have_key("by_country")
      expect(json).to have_key("by_hour")
      expect(json["by_country"]).to eq("US" => 1)
    end

    it "returns 404 for unknown key" do
      get analytics_api_v1_link_path("nonexistent")
      expect(response).to have_http_status(:not_found)
    end
  end
end
