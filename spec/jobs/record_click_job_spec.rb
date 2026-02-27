# frozen_string_literal: true

require "rails_helper"

RSpec.describe RecordClickJob, type: :job do
  include ActiveJob::TestHelper

  let(:link) { create(:link) }
  let(:job_args) do
    { link_id: link.id, ip_address: "192.168.1.1", user_agent: "Mozilla/5.0 Test" }
  end

  before do
    allow(Geocoder).to receive(:search).and_return([])
  end

  describe "#perform" do
    it "enqueues the job with correct arguments" do
      expect { described_class.perform_later(**job_args) }.to have_enqueued_job(described_class)
                                                                .with(**job_args)
    end

    it "calls Analytics::RecordClick with the job arguments when performed" do
      expect(Analytics::RecordClick).to receive(:call).with(
        link_id: link.id,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0 Test"
      )

      perform_enqueued_jobs { described_class.perform_later(**job_args) }
    end

    it "creates a Click and increments link clicks_count when performed" do
      expect(link.clicks_count).to eq(0)

      perform_enqueued_jobs { described_class.perform_later(**job_args) }

      expect(link.clicks.reload.count).to eq(1)
      expect(link.reload.clicks_count).to eq(1)
      click = link.clicks.last
      expect(click.ip_address).to eq("192.168.1.1")
      expect(click.user_agent).to eq("Mozilla/5.0 Test")
    end
  end
end
