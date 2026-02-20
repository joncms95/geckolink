# frozen_string_literal: true

class GeolocateIpJob < ApplicationJob
  queue_as :default

  def perform(visit_id)
    visit = Visit.find_by(id: visit_id)
    return unless visit
    return if visit.ip_address.blank?
    return if visit.ip_address == "127.0.0.1" || visit.ip_address == "::1"

    result = Geocoder.search(visit.ip_address).first
    return unless result

    geolocation = [ result.city, result.country ].compact.join(", ")
    visit.update_columns(
      geolocation: geolocation.presence,
      country: result.country.to_s.presence
    )
  end
end
