# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Redirects", type: :request do
  let(:link) { create(:link, url: "https://example.com/dest") }

  it "redirects to the link URL and increments clicks" do
    get "/#{link.short_code}"
    expect(response).to redirect_to("https://example.com/dest")
    expect(response).to have_http_status(:found)
    expect(link.reload.clicks_count).to eq(1)
  end

  it "returns 404 for unknown short_code" do
    get "/nonexistent123"
    expect(response).to have_http_status(:not_found)
  end
end
