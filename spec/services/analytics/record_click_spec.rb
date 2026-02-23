# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::RecordClick do
  let(:link) { create(:link) }

  describe ".call" do
    it "creates a click with ip and user_agent" do
      allow(Geocoder).to receive(:search).and_return([])
      click = described_class.call(
        link_id: link.id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
      expect(click).to be_present
      expect(click.link_id).to eq(link.id)
      expect(click.ip_address).to eq("1.2.3.4")
      expect(click.user_agent).to eq("Mozilla/5.0")
    end

    it "does nothing when link does not exist" do
      expect(described_class.call(link_id: -1, ip_address: "1.2.3.4", user_agent: nil)).to be_nil
    end

    it "invalidates dashboard stats cache for the link owner when link has user_id" do
      user = create(:user)
      user_link = create(:link, user_id: user.id)
      allow(Geocoder).to receive(:search).and_return([])

      expect(Dashboard::StatsQuery).to receive(:invalidate_for_user).with(user.id)

      described_class.call(
        link_id: user_link.id,
        ip_address: "1.2.3.4",
        user_agent: nil
      )
    end

    it "does not call dashboard invalidation for anonymous links" do
      anon_link = create(:link, user_id: nil)
      allow(Geocoder).to receive(:search).and_return([])

      expect(Dashboard::StatsQuery).not_to receive(:invalidate_for_user)

      described_class.call(
        link_id: anon_link.id,
        ip_address: "1.2.3.4",
        user_agent: nil
      )
    end
  end
end
