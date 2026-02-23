# frozen_string_literal: true

require "rails_helper"

RSpec.describe Link, type: :model do
  describe "validations" do
    it "validates target_url format (http or https only)" do
      expect(build(:link, target_url: "http://ok.com")).to be_valid
      expect(build(:link, target_url: "https://ok.com")).to be_valid
      expect(build(:link, target_url: "ftp://no.com")).not_to be_valid
      expect(build(:link, target_url: "javascript:alert(1)")).not_to be_valid
    end

    it "validates presence of target_url" do
      expect(build(:link, target_url: nil)).not_to be_valid
    end

    it "rejects target_url without valid domain (no TLD)" do
      expect(build(:link, target_url: "https://mlbbdraft")).not_to be_valid
      expect(build(:link, target_url: "https://something")).not_to be_valid
    end

    it "accepts target_url with domain or localhost" do
      expect(build(:link, target_url: "https://example.com")).to be_valid
      expect(build(:link, target_url: "https://sub.mlbbdraft.co")).to be_valid
      expect(build(:link, target_url: "http://localhost/path")).to be_valid
    end
  end

  describe "normalize_target_url" do
    it "prepends https:// when scheme is missing" do
      link = Link.new(target_url: "example.com")
      link.valid?
      expect(link.target_url).to eq("https://example.com")
    end

    it "leaves https:// and http:// unchanged" do
      link = Link.new(target_url: "https://example.com")
      link.valid?
      expect(link.target_url).to eq("https://example.com")
    end
  end
end
