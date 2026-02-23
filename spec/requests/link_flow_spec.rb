# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Link flow (create → redirect → analytics)", type: :request do
  it "creates a link, redirects by key, and returns analytics" do
    allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(nil)
    post api_v1_links_path, params: { link: { target_url: "https://example.com/target" } }, as: :json
    expect(response).to have_http_status(:created)
    json = response.parsed_body
    link_key = json["key"]
    expect(link_key).to be_present

    get "/#{link_key}"
    expect(response).to have_http_status(:found)
    expect(response.headers["Location"]).to eq("https://example.com/target")

    get analytics_api_v1_link_path(link_key)
    expect(response).to have_http_status(:ok)
    report = response.parsed_body
    expect(report).to have_key("by_country")
    expect(report).to have_key("by_hour")
  end
end
