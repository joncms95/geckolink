# frozen_string_literal: true

require "rails_helper"

RSpec.describe VisitTrackerJob do
  let(:link) { create(:link) }

  describe "#perform" do
    it "creates a visit and enqueues GeolocateIpJob" do
      expect {
        described_class.perform_now(
          link_id: link.id,
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0"
        )
      }.to change(link.visits, :count).by(1)
        .and have_enqueued_job(GeolocateIpJob)

      visit = link.visits.last
      expect(visit.ip_address).to eq("192.168.1.1")
      expect(visit.user_agent).to eq("Mozilla/5.0")
      expect(visit.visited_at).to be_within(2.seconds).of(Time.current)
    end

    context "when link does not exist" do
      it "does not raise" do
        expect { described_class.perform_now(link_id: -1, ip_address: "1.2.3.4", user_agent: nil) }.not_to raise_error
      end
    end
  end
end
