# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shortener::CreateService do
  subject(:service) { described_class.new }

  before do
    allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(nil)
  end

  describe "#call" do
    context "with blank URL" do
      it "returns failure" do
        result = service.call(original_url: "   ")
        expect(result).to be_failure
        expect(result.error).to include("URL can't be blank")
      end
    end

    context "with invalid URL scheme" do
      it "returns failure for javascript:" do
        result = service.call(original_url: "javascript:alert(1)")
        expect(result).to be_failure
        expect(result.error).to be_present
      end

      it "returns failure for ftp:" do
        result = service.call(original_url: "ftp://example.com")
        expect(result).to be_failure
      end
    end

    context "with valid http URL" do
      let(:url) { "https://example.com/page" }

      it "returns success with a link" do
        result = service.call(original_url: url)
        expect(result).to be_success
        expect(result.value).to be_a(Link)
        expect(result.value.url).to eq(url)
        expect(result.value.short_code).to be_present
        expect(result.value.clicks_count).to eq(0)
      end

      it "assigns a random 7-character short_code (alphanumeric)" do
        result = service.call(original_url: url)
        link = result.value
        expect(link.short_code).to match(/\A[0-9a-zA-Z]{7}\z/)
        expect(link.short_code).to be_present
      end

      it "retries on short_code collision and succeeds with new code" do
        existing = create(:link, short_code: "abc1234")
        allow(Shortener::RandomCode).to receive(:generate).and_return(
          existing.short_code,
          "xyz9876"
        )
        result = service.call(original_url: url)
        expect(result).to be_success
        expect(result.value.short_code).to eq("xyz9876")
      end
    end

    context "with valid https URL" do
      it "returns success" do
        result = service.call(original_url: "https://secure.example.com")
        expect(result).to be_success
        expect(result.value.url).to eq("https://secure.example.com")
      end
    end
  end
end
