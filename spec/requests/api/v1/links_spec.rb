# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Links", type: :request do
  describe "POST /api/v1/links" do
    let(:valid_url) { "https://example.com/page" }
    let(:params) { { link: { url: valid_url } } }

    before do
      allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(nil)
    end

    it "creates a link and returns short URL" do
      post api_v1_links_path, params: params, as: :json
      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["url"]).to eq(valid_url)
      expect(json["short_code"]).to be_present
      expect(json["short_url"]).to include(json["short_code"])
      expect(json["clicks_count"]).to eq(0)
    end

    it "returns link with title and icon when fetch succeeds" do
      allow(Metadata::TitleAndIconFetcher).to receive(:call)
        .with(valid_url, timeout_sec: 5)
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
        post api_v1_links_path, params: { link: { url: "javascript:alert(1)" } }, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to be_present
      end
    end

    context "without link param" do
      it "returns 422 with errors" do
        post api_v1_links_path, params: {}, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]).to be_present
      end
    end
  end

  describe "GET /api/v1/links (index)" do
    context "when not authenticated" do
      it "returns empty list when no short_codes" do
        get api_v1_links_path, params: { page: 1, per_page: 10 }
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["links"]).to eq([])
        expect(response.parsed_body["total"]).to eq(0)
      end

      it "returns links by short_codes with page and per_page (e.g. 10 per page)" do
        a = create(:link, url: "https://a.com", user_id: nil)
        b = create(:link, url: "https://b.com", user_id: nil)
        c = create(:link, url: "https://c.com", user_id: nil)
        codes = [ a, b, c ].map(&:short_code).join(",")
        get api_v1_links_path, params: { short_codes: codes, page: 1, per_page: 10 }
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total"]).to eq(3)
        expect(json["links"].size).to eq(3)
        get api_v1_links_path, params: { short_codes: codes, page: 1, per_page: 2 }
        json2 = response.parsed_body
        expect(json2["total"]).to eq(3)
        expect(json2["links"].size).to eq(2)
      end
    end

    context "when authenticated" do
      let(:user) { create(:user) }

      before do
        post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
      end

      it "returns only current user links ordered by created_at desc" do
        other_user = create(:user)
        my_newer = create(:link, url: "https://my-newer.com", user_id: user.id)
        my_older = create(:link, url: "https://my-older.com", user_id: user.id)
        create(:link, url: "https://other.com", user_id: other_user.id)

        get api_v1_links_path, params: { page: 1, per_page: 10 }
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["total"]).to eq(2)
        expect(json["links"].map { |l| l["short_code"] }).to contain_exactly(my_newer.short_code, my_older.short_code)
      end

      it "returns empty list when user has no links" do
        get api_v1_links_path
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["links"]).to eq([])
        expect(response.parsed_body["total"]).to eq(0)
      end
    end
  end

  describe "GET /api/v1/links/:short_code" do
    let(:link) { create(:link) }

    it "returns the link" do
      get api_v1_link_path(link.short_code)
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["short_code"]).to eq(link.short_code)
      expect(json["url"]).to eq(link.url)
    end

    it "returns 404 for unknown short_code" do
      get api_v1_link_path("nonexistent")
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/links/:short_code/analytics" do
    let(:link) { create(:link) }

    it "returns report with by_country and by_hour" do
      create(:visit, link: link, country: "US")
      get analytics_api_v1_link_path(link.short_code)
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to have_key("by_country")
      expect(json).to have_key("by_hour")
      expect(json["by_country"]).to eq("US" => 1)
    end

    it "returns 404 for unknown short_code" do
      get analytics_api_v1_link_path("nonexistent")
      expect(response).to have_http_status(:not_found)
    end
  end
end
