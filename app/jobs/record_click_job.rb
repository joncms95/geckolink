# frozen_string_literal: true

class RecordClickJob < ApplicationJob
  queue_as :default

  def perform(link_id:, ip_address:, user_agent:)
    Analytics::RecordClick.call(
      link_id: link_id,
      ip_address: ip_address,
      user_agent: user_agent
    )
  end
end
