# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ReportQuery do
  let(:link) { create(:link) }

  describe "#call" do
    it "returns by_country, by_hour, clicks_count, and top_location" do
      create(:click, link: link, country: "Germany")
      create(:click, link: link, country: "Germany")
      create(:click, link: link, country: "France")
      link.update!(clicks_count: 3)

      report = described_class.call(link: link)

      expect(report[:by_country]).to eq("Germany" => 2, "France" => 1)
      expect(report[:by_hour]).to be_a(Hash)
      expect(report[:clicks_count]).to eq(3)
      expect(report[:top_location]).to eq("Germany")
    end

    it "returns nil top_location when there are no clicks" do
      report = described_class.call(link: link)
      expect(report[:top_location]).to be_nil
      expect(report[:clicks_count]).to eq(0)
    end
  end

  describe "by_country within #call" do
    it "excludes clicks with nil country" do
      create(:click, link: link, country: "US")
      create(:click, link: link, country: nil)

      report = described_class.call(link: link)
      expect(report[:by_country]).to eq("US" => 1)
    end
  end
end
