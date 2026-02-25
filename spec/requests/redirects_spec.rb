# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Redirects", type: :request do
  include ActiveJob::TestHelper

  let(:link) { create(:link, target_url: "https://example.com/dest") }

  it "redirects to the target URL and increments clicks" do
    get "/#{link.key}"
    expect(response).to redirect_to("https://example.com/dest")
    expect(response).to have_http_status(:found)
    expect(link.reload.clicks_count).to eq(1)
  end

  it "records a click for the link" do
    perform_enqueued_jobs do
      get "/#{link.key}"
    end
    expect(link.clicks.reload.count).to eq(1)
    expect(link.clicks.last.ip_address).to be_present
  end

  it "returns 404 for unknown key" do
    get "/nonexistent123"
    expect(response).to have_http_status(:not_found)
  end
end
