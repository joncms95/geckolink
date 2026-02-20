# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shortener::CreateService do
  subject(:service) { described_class.new }

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

      it "assigns short_code from Base62 of id" do
        result = service.call(original_url: url)
        link = result.value
        expect(Shortener::Base62.decode(link.short_code)).to eq(link.id)
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
