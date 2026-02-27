# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Link flow (create → redirect → analytics)", type: :request do
  include ActiveJob::TestHelper

  it "creates a link, redirects by key, and returns analytics" do
    allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(Result.failure("Invalid URL"))
    user = create(:user)
    post api_v1_session_path, params: { session: { email: user.email, password: "password123" } }, as: :json
    token = response.parsed_body["token"]
    reset!

    post api_v1_links_path, params: { link: { target_url: "https://example.com/target" } }, as: :json,
                            headers: { "Authorization" => "Bearer #{token}" }
    expect(response).to have_http_status(:created)
    json = response.parsed_body
    link_key = json["key"]
    expect(link_key).to be_present

    perform_enqueued_jobs do
      get "/#{link_key}"
    end
    expect(response).to have_http_status(:found)
    expect(response.headers["Location"]).to eq("https://example.com/target")

    get analytics_api_v1_link_path(link_key), headers: { "Authorization" => "Bearer #{token}" }
    expect(response).to have_http_status(:ok)
    report = response.parsed_body
    expect(report).to have_key("by_country")
    expect(report).to have_key("by_hour")
  end
end
