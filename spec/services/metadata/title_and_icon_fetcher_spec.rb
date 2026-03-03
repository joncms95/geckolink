# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metadata::TitleAndIconFetcher do
  let(:ddg) { described_class::DUCKDUCKGO_FAVICON }

  describe ".call" do
    context "with invalid URL" do
      it "returns failure for blank URL" do
        result = described_class.call("")
        expect(result).to be_failure
        expect(result.error).to eq("Invalid URL")
      end
    end

    context "with valid URL" do
      context "when HTML fetch fails (timeout, non-HTML, or error)" do
        it "returns success with nil title and DuckDuckGo icon" do
          stub_request(:get, "https://example.com/").to_timeout

          result = described_class.call("https://example.com/")

          expect(result).to be_success
          expect(result.value[:title]).to be_nil
          expect(result.value[:icon_url]).to eq("#{ddg}/example.com.ico")
        end

        it "normalizes schemeless URL and uses normalized host for icon" do
          stub_request(:get, "https://facebook.com/").to_timeout

          result = described_class.call("facebook.com")

          expect(result).to be_success
          expect(result.value[:icon_url]).to eq("#{ddg}/facebook.com.ico")
        end

        it "uses exact host for icon (e.g. with www)" do
          stub_request(:get, "https://www.example.com/").to_timeout

          result = described_class.call("https://www.example.com/")

          expect(result).to be_success
          expect(result.value[:icon_url]).to eq("#{ddg}/www.example.com.ico")
        end

        it "rejects non-HTML response and still returns icon" do
          stub_request(:get, "https://example.com/")
            .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: "{}")

          result = described_class.call("https://example.com/")

          expect(result).to be_success
          expect(result.value[:title]).to be_nil
          expect(result.value[:icon_url]).to eq("#{ddg}/example.com.ico")
        end
      end

      context "when HTML fetch succeeds" do
        it "extracts title from <title> and icon from DuckDuckGo by host" do
          stub_get("https://example.com/", "<html><head><title>My Site</title></head></html>")

          result = described_class.call("https://example.com/")

          expect(result).to be_success
          expect(result.value[:title]).to eq("My Site")
          expect(result.value[:icon_url]).to eq("#{ddg}/example.com.ico")
        end

        it "falls back to og:title when <title> is missing" do
          html = '<html><head><meta property="og:title" content="OG Title"></head></html>'
          stub_get("https://example.com/", html)

          result = described_class.call("https://example.com/")

          expect(result.value[:title]).to eq("OG Title")
        end

        it "falls back to twitter:title when <title> and og:title missing" do
          html = '<html><head><meta name="twitter:title" content="Twitter Title"></head></html>'
          stub_get("https://example.com/", html)

          result = described_class.call("https://example.com/")

          expect(result.value[:title]).to eq("Twitter Title")
        end

        it "returns nil title when no title source exists" do
          stub_get("https://example.com/", "<html><head></head><body></body></html>")

          result = described_class.call("https://example.com/")

          expect(result.value[:title]).to be_nil
        end

        it "truncates title at 100 characters" do
          long = "a" * 150
          stub_get("https://example.com/", "<html><head><title>#{long}</title></head></html>")

          result = described_class.call("https://example.com/")

          expect(result.value[:title].length).to eq(100)
        end

        it "accepts application/xhtml+xml" do
          stub_request(:get, "https://example.com/")
            .to_return(
              status: 200,
              headers: { "Content-Type" => "application/xhtml+xml" },
              body: "<html><head><title>XHTML</title></head></html>"
            )

          result = described_class.call("https://example.com/")

          expect(result.value[:title]).to eq("XHTML")
        end

        it "always uses DuckDuckGo for icon regardless of HTML" do
          stub_get("https://example.com/", '<html><head><link rel="icon" href="https://cdn.example.com/fav.ico"></head></html>')

          result = described_class.call("https://example.com/")

          expect(result.value[:icon_url]).to eq("#{ddg}/example.com.ico")
        end
      end
    end
  end

  def stub_get(url, body)
    stub_request(:get, url)
      .to_return(status: 200, headers: { "Content-Type" => "text/html" }, body: body)
  end
end
