# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Up (health check)", type: :request do
  it "returns ok" do
    get "/up"
    expect(response).to have_http_status(:ok)
  end
end
