# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metadata::TitleAndIconFetcher do
  describe ".call" do
    it "returns nil for non-HTML response" do
      stub_request(:get, "https://example.com/")
        .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: "{}")
      expect(described_class.call("https://example.com/")).to be_nil
    end

    it "returns title and icon_url for HTML with title and favicon" do
      stub_request(:get, "https://example.com/")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "text/html" },
          body: "<html><head><title>Example</title><link rel=\"icon\" href=\"/fav.ico\"></head></html>"
        )
      result = described_class.call("https://example.com/")
      expect(result).to be_present
      expect(result[:title]).to eq("Example")
      expect(result[:icon_url]).to eq("https://example.com/fav.ico")
    end

    it "returns nil on timeout" do
      stub_request(:get, %r{\Ahttps://example\.com}).to_timeout
      expect(described_class.call("https://example.com/", timeout_sec: 1)).to be_nil
    end
  end
end
