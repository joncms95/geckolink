# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ReportQuery do
  let(:link) { create(:link) }

  describe "#call" do
    it "returns by_country and by_hour" do
      create(:visit, link: link, country: "Germany")
      create(:visit, link: link, country: "Germany")
      create(:visit, link: link, country: "France")

      report = described_class.new(link: link).call

      expect(report[:by_country]).to eq("Germany" => 2, "France" => 1)
      expect(report[:by_hour]).to be_a(Hash)
    end
  end

  describe "#by_country" do
    it "excludes visits with nil country" do
      create(:visit, link: link, country: "US")
      create(:visit, link: link, country: nil)

      result = described_class.new(link: link).by_country
      expect(result).to eq("US" => 1)
    end
  end
end
