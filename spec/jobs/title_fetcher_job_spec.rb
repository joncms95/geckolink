# frozen_string_literal: true

require "rails_helper"

RSpec.describe TitleFetcherJob do
  let(:link) { create(:link, url: "https://example.com", title: nil) }

  describe "#perform" do
    context "when link does not exist" do
      it "does not raise" do
        expect { described_class.perform_now(-1) }.not_to raise_error
      end
    end

    context "when response is HTML with title" do
      before do
        stub_request(:get, %r{\Ahttps://example\.com/?\z})
          .to_return(status: 200, headers: { "Content-Type" => "text/html" }, body: "<html><head><title>Example Site</title></head></html>")
      end

      it "updates link title" do
        described_class.perform_now(link.id)
        expect(link.reload.title).to eq("Example Site")
      end
    end

    context "when response is not HTML" do
      before do
        stub_request(:get, %r{\Ahttps://example\.com/?\z})
          .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: '{"title":"No"}')
      end

      it "does not update link title" do
        described_class.perform_now(link.id)
        expect(link.reload.title).to be_nil
      end
    end

    context "when response is a redirect then HTML with title" do
      before do
        stub_request(:get, "https://example.com/")
          .with(headers: { "User-Agent" => /Firefox/, "Accept" => /text\/html/ })
          .to_return(status: 302, headers: { "Location" => "https://example.com/welcome" })
        stub_request(:get, "https://example.com/welcome")
          .with(headers: { "User-Agent" => /Firefox/, "Accept" => /text\/html/ })
          .to_return(status: 200, headers: { "Content-Type" => "text/html" }, body: "<html><head><title>Welcome Page</title></head></html>")
      end

      it "follows redirect and updates link title" do
        described_class.perform_now(link.id)
        expect(link.reload.title).to eq("Welcome Page")
      end
    end

    context "when request times out" do
      before do
        stub_request(:get, %r{\Ahttps://example\.com/?\z}).to_timeout
      end

      it "does not raise and does not update title" do
        expect { described_class.perform_now(link.id) }.not_to raise_error
        expect(link.reload.title).to be_nil
      end
    end
  end
end
