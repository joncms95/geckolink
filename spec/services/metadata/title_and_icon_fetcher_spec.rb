# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metadata::TitleAndIconFetcher do
  let(:duckduckgo) { "https://icons.duckduckgo.com/ip3" }

  describe ".call" do
    context "when fetch fails" do
      it "returns DuckDuckGo icon on timeout" do
        stub_request(:get, "https://example.com/").to_timeout
        result = described_class.call("https://example.com/", timeout_sec: 1)
        expect(result).to eq(icon_url: "#{duckduckgo}/example.com.ico")
      end

      it "returns DuckDuckGo icon for non-HTML response" do
        stub_request(:get, "https://example.com/")
          .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: "{}")
        result = described_class.call("https://example.com/")
        expect(result).to eq(icon_url: "#{duckduckgo}/example.com.ico")
      end

      it "normalizes schemeless URLs before falling back" do
        stub_request(:get, "https://facebook.com/").to_timeout
        result = described_class.call("facebook.com")
        expect(result).to eq(icon_url: "#{duckduckgo}/facebook.com.ico")
      end

      it "returns nil for blank URL" do
        expect(described_class.call("")).to be_nil
      end
    end

    context "when fetch succeeds" do
      it "extracts title from HTML" do
        stub_html("https://example.com/",
          "<html><head><title>Example</title></head></html>")
        result = described_class.call("https://example.com/")
        expect(result[:title]).to eq("Example")
      end

      it "returns nil title when page has none" do
        stub_html("https://www.facebook.com/",
          "<html><head></head><body></body></html>")
        result = described_class.call("https://www.facebook.com/")
        expect(result[:title]).to be_nil
      end

      it "handles application/xhtml+xml content type" do
        stub_request(:get, "https://example.com/")
          .to_return(
            status: 200,
            headers: { "Content-Type" => "application/xhtml+xml" },
            body: "<html><head><title>XHTML Page</title></head></html>"
          )
        result = described_class.call("https://example.com/")
        expect(result[:title]).to eq("XHTML Page")
      end

      it "uses DuckDuckGo when no icon in HTML" do
        stub_html("https://example.com/",
          "<html><head><title>No Icon</title></head></html>")
        result = described_class.call("https://example.com/")
        expect(result[:icon_url]).to eq("#{duckduckgo}/example.com.ico")
      end

      it "replaces same-origin favicon with DuckDuckGo" do
        stub_html("https://example.com/",
          '<html><head><link rel="icon" href="/fav.ico"></head></html>')
        result = described_class.call("https://example.com/")
        expect(result[:icon_url]).to eq("#{duckduckgo}/example.com.ico")
      end

      it "keeps cross-origin (CDN) favicon" do
        stub_html("https://example.com/",
          '<html><head><link rel="icon" href="https://cdn.example.net/fav.ico"></head></html>')
        result = described_class.call("https://example.com/")
        expect(result[:icon_url]).to eq("https://cdn.example.net/fav.ico")
      end

      it "prefers icon closest to preferred size" do
        html = <<~HTML
          <html><head>
            <link rel="icon" href="https://cdn.example.net/small.ico" sizes="16x16">
            <link rel="icon" href="https://cdn.example.net/large.ico" sizes="192x192">
          </head></html>
        HTML
        stub_html("https://example.com/", html)
        result = described_class.call("https://example.com/")
        expect(result[:icon_url]).to eq("https://cdn.example.net/large.ico")
      end
    end
  end

  private

  def stub_html(url, body)
    stub_request(:get, url)
      .to_return(status: 200, headers: { "Content-Type" => "text/html" }, body: body)
  end
end
