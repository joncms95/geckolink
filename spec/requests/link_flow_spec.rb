# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Link flow (create → redirect → analytics)", type: :request do
  it "creates a link, redirects by short_code, and returns analytics" do
    post api_v1_links_path, params: { link: { url: "https://example.com/target" } }, as: :json
    expect(response).to have_http_status(:created)
    json = response.parsed_body
    short_code = json["short_code"]
    expect(short_code).to be_present

    get "/#{short_code}"
    expect(response).to have_http_status(:found)
    expect(response.headers["Location"]).to eq("https://example.com/target")

    get analytics_api_v1_link_path(short_code)
    expect(response).to have_http_status(:ok)
    report = response.parsed_body
    expect(report).to have_key("by_country")
    expect(report).to have_key("by_hour")
  end
end
