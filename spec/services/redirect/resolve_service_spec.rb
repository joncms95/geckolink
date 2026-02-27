# frozen_string_literal: true

require "rails_helper"

RSpec.describe Redirect::ResolveService do
  describe ".call" do
    it "returns success with link_id and url when key exists" do
      link = create(:link, key: "abc1234", target_url: "https://example.com/dest")
      result = described_class.call(key: link.key)
      expect(result).to be_success
      expect(result.value[:link_id]).to eq(link.id)
      expect(result.value[:url]).to eq("https://example.com/dest")
    end

    it "returns failure when key does not exist" do
      result = described_class.call(key: "nonexistent")
      expect(result).to be_failure
      expect(result.error).to eq("Link not found")
    end

    it "reads through cache on second call (cache hit)" do
      link = create(:link, key: "cachedkey", target_url: "https://cached.example.com")
      cache_key = described_class.send(:cache_key, link.key)
      payload = { "link_id" => link.id, "url" => link.target_url }
      allow(Rails.cache).to receive(:read).with(cache_key).and_return(nil, payload)
      allow(Rails.cache).to receive(:write)
      allow(Link).to receive(:find_by).and_call_original

      described_class.call(key: link.key)
      result = described_class.call(key: link.key)

      expect(Link).to have_received(:find_by).with(key: "cachedkey").once
      expect(result).to be_success
      expect(result.value[:url]).to eq("https://cached.example.com")
    end
  end
end
