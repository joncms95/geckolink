# frozen_string_literal: true

Geocoder.configure(
  timeout: 3,
  lookup: Rails.env.test? ? :test : :ipinfo_io,
  ip_lookup: Rails.env.test? ? :test : :ipinfo_io
)
