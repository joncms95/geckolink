# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Rack::Attack throttles", type: :request do
  before do
    @original_cache = Rails.cache
    @memory_store = ActiveSupport::Cache::MemoryStore.new
    Rails.cache = @memory_store
    Rack::Attack.cache.store = @memory_store
  end

  after do
    Rails.cache = @original_cache
    Rack::Attack.cache.store = @original_cache
    Rack::Attack.reset!
  end

  describe "links/create throttle (30 per minute per IP)" do
    before do
      allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(Result.failure("skip"))
    end

    it "returns 429 when limit exceeded" do
      30.times do
        post api_v1_links_path, params: { link: { target_url: "https://example.com/#{SecureRandom.hex(4)}" } }, as: :json
        expect(response).not_to have_http_status(:too_many_requests), "request #{response.body}"
      end

      post api_v1_links_path, params: { link: { target_url: "https://example.com/one-more" } }, as: :json
      expect(response).to have_http_status(:too_many_requests)
    end
  end

  describe "signup throttle (10 per hour per IP)" do
    it "returns 429 when limit exceeded" do
      10.times do |n|
        post api_v1_registrations_path, params: {
                                          user: { email: "user#{n}@throttle.example.com", password: "password123", password_confirmation: "password123" }
                                        }, as: :json
        expect(response).not_to have_http_status(:too_many_requests)
      end

      post api_v1_registrations_path, params: {
                                        user: { email: "user11@throttle.example.com", password: "password123", password_confirmation: "password123" }
                                      }, as: :json
      expect(response).to have_http_status(:too_many_requests)
    end
  end
end
