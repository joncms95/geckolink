# frozen_string_literal: true

require "rails_helper"

RSpec.describe Link, type: :model do
  describe "validations" do
    it "accepts valid http and https URLs" do
      expect(build(:link, target_url: "http://ok.com")).to be_valid
      expect(build(:link, target_url: "https://ok.com")).to be_valid
      expect(build(:link, target_url: "https://example.com/page?q=1")).to be_valid
      expect(build(:link, target_url: "https://sub.example.com")).to be_valid
      expect(build(:link, target_url: "http://192.168.1.1")).to be_valid
    end

    it "rejects non-http schemes" do
      expect(build(:link, target_url: "ftp://no.com")).not_to be_valid
      expect(build(:link, target_url: "javascript:alert(1)")).not_to be_valid
      expect(build(:link, target_url: "file:///etc/passwd")).not_to be_valid
    end

    it "rejects blank target_url" do
      expect(build(:link, target_url: nil)).not_to be_valid
      expect(build(:link, target_url: "")).not_to be_valid
      expect(build(:link, target_url: "   ")).not_to be_valid
    end

    it "rejects hosts without a dot (single-word hosts)" do
      expect(build(:link, target_url: "https://mlbbdraft")).not_to be_valid
      expect(build(:link, target_url: "https://something")).not_to be_valid
      expect(build(:link, target_url: "http://com")).not_to be_valid
    end

    it "rejects localhost" do
      expect(build(:link, target_url: "http://localhost")).not_to be_valid
      expect(build(:link, target_url: "http://localhost:3000")).not_to be_valid
      expect(build(:link, target_url: "http://localhost/path")).not_to be_valid
    end

    it "rejects URLs with no host or dot-only hosts" do
      expect(build(:link, target_url: "https:///")).not_to be_valid
      expect(build(:link, target_url: "https:///path")).not_to be_valid
      expect(build(:link, target_url: "https://.")).not_to be_valid
      expect(build(:link, target_url: "https://..")).not_to be_valid
      expect(build(:link, target_url: "http://.com")).not_to be_valid
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
