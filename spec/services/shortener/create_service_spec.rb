# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shortener::CreateService do
  before do
    allow(Metadata::TitleAndIconFetcher).to receive(:call).and_return(Result.failure("Invalid URL"))
  end

  describe ".call" do
    context "with blank URL" do
      it "returns failure" do
        result = described_class.call(original_url: "   ")
        expect(result).to be_failure
        expect(result.error).to include("URL can't be blank")
      end
    end

    context "with invalid URL scheme" do
      it "returns failure for javascript:" do
        result = described_class.call(original_url: "javascript:alert(1)")
        expect(result).to be_failure
        expect(result.error).to be_present
      end

      it "returns failure for ftp:" do
        result = described_class.call(original_url: "ftp://example.com")
        expect(result).to be_failure
      end
    end

    context "with valid http URL" do
      let(:url) { "https://example.com/page" }

      it "returns success with a link" do
        result = described_class.call(original_url: url)
        expect(result).to be_success
        expect(result.value).to be_a(Link)
        expect(result.value.target_url).to eq(url)
        expect(result.value.key).to be_present
        expect(result.value.clicks_count).to eq(0)
      end

      it "assigns a random 7-character key (alphanumeric)" do
        result = described_class.call(original_url: url)
        link = result.value
        expect(link.key).to match(/\A[0-9a-zA-Z]{7}\z/)
        expect(link.key).to be_present
      end

      it "retries on key collision and succeeds with new key" do
        existing = create(:link)
        existing.update_column(:key, "abc1234")
        allow(Shortener::RandomKey).to receive(:generate).and_return(
          "abc1234",
          "xyz9876"
        )
        result = described_class.call(original_url: url)
        expect(result).to be_success
        expect(result.value.key).to eq("xyz9876")
      end
    end

    context "with valid https URL" do
      it "returns success" do
        result = described_class.call(original_url: "https://secure.example.com")
        expect(result).to be_success
        expect(result.value.target_url).to eq("https://secure.example.com")
      end
    end
  end
end
