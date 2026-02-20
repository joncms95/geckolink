# frozen_string_literal: true

require "rails_helper"

RSpec.describe GeolocateIpJob do
  let(:link) { create(:link) }
  let(:visit) { create(:visit, link: link, ip_address: "8.8.8.8", geolocation: nil, country: nil) }

  before do
    Geocoder::Lookup::Test.reset
    Geocoder::Lookup::Test.add_stub(
      "8.8.8.8",
      [ { "city" => "Mountain View", "country" => "United States" } ]
    )
  end

  describe "#perform" do
    it "updates visit with geolocation and country" do
      described_class.perform_now(visit.id)
      visit.reload
      expect(visit.geolocation).to eq("Mountain View, United States")
      expect(visit.country).to eq("United States")
    end

    context "when visit has localhost IP" do
      let(:visit) { create(:visit, link: link, ip_address: "127.0.0.1", geolocation: nil) }

      it "does not update geolocation" do
        described_class.perform_now(visit.id)
        expect(visit.reload.geolocation).to be_nil
      end
    end

    context "when visit does not exist" do
      it "does not raise" do
        expect { described_class.perform_now(-1) }.not_to raise_error
      end
    end
  end
end
