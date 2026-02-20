# frozen_string_literal: true

class VisitTrackerJob < ApplicationJob
  queue_as :default

  def perform(link_id:, ip_address:, user_agent:)
    link = Link.find_by(id: link_id)
    return unless link

    visit = link.visits.create!(
      ip_address: ip_address.presence,
      user_agent: user_agent.presence&.slice(0, 1024),
      visited_at: Time.current
    )
    GeolocateIpJob.perform_later(visit.id)
  end
end
