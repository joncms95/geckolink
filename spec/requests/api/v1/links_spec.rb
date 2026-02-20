# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Links", type: :request do
  describe "POST /api/v1/links" do
    let(:valid_url) { "https://example.com/page" }
    let(:params) { { link: { url: valid_url } } }

    it "creates a link and returns short URL" do
      post api_v1_links_path, params: params, as: :json
      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["url"]).to eq(valid_url)
      expect(json["short_code"]).to be_present
      expect(json["short_url"]).to include(json["short_code"])
      expect(json["clicks_count"]).to eq(0)
    end

    it "enqueues TitleFetcherJob" do
      expect { post api_v1_links_path, params: params, as: :json }
        .to have_enqueued_job(TitleFetcherJob)
    end

    context "with invalid URL" do
      it "returns 422 with errors" do
        post api_v1_links_path, params: { link: { url: "javascript:alert(1)" } }, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]).to be_present
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
