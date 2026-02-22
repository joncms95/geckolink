# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::RecordVisit do
  let(:link) { create(:link) }

  describe ".call" do
    it "creates a visit with ip and user_agent" do
      allow(Geocoder).to receive(:search).and_return([])
      visit = described_class.call(
        link_id: link.id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
      expect(visit).to be_present
      expect(visit.link_id).to eq(link.id)
      expect(visit.ip_address).to eq("1.2.3.4")
      expect(visit.user_agent).to eq("Mozilla/5.0")
    end

    it "does nothing when link does not exist" do
      expect(described_class.call(link_id: -1, ip_address: "1.2.3.4", user_agent: nil)).to be_nil
    end
  end
end
