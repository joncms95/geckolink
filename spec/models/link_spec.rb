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
  end

  describe "after_create" do
    it "assigns short_code from Base62 of id" do
      link = Link.create!(url: "https://example.com")
      expect(link.short_code).to eq(Shortener::Base62.encode(link.id))
    end
  end
end
