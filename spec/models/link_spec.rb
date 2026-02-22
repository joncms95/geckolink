# frozen_string_literal: true

require "rails_helper"

RSpec.describe Link, type: :model do
  describe "validations" do
    it "validates url format (http or https only)" do
      expect(build(:link, url: "http://ok.com")).to be_valid
      expect(build(:link, url: "https://ok.com")).to be_valid
      expect(build(:link, url: "ftp://no.com")).not_to be_valid
      expect(build(:link, url: "javascript:alert(1)")).not_to be_valid
    end

    it "validates presence of url" do
      expect(build(:link, url: nil)).not_to be_valid
    end

    it "rejects url without valid domain (no TLD)" do
      expect(build(:link, url: "https://mlbbdraft")).not_to be_valid
      expect(build(:link, url: "https://something")).not_to be_valid
    end

    it "accepts url with domain or localhost" do
      expect(build(:link, url: "https://example.com")).to be_valid
      expect(build(:link, url: "https://sub.mlbbdraft.co")).to be_valid
      expect(build(:link, url: "http://localhost/path")).to be_valid
    end
  end

  describe "normalize_url" do
    it "prepends https:// when scheme is missing" do
      link = Link.new(url: "example.com")
      link.valid?
      expect(link.url).to eq("https://example.com")
    end

    it "leaves https:// and http:// unchanged" do
      link = Link.new(url: "https://example.com")
      link.valid?
      expect(link.url).to eq("https://example.com")
    end
  end
end
