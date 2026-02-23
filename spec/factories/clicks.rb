# frozen_string_literal: true

FactoryBot.define do
  factory :click do
    association :link
    ip_address { Faker::Internet.ip_v4_address }
    user_agent { Faker::Internet.user_agent }
    geolocation { "#{Faker::Address.city}, #{Faker::Address.country}" }
    country { Faker::Address.country }
    clicked_at { 1.hour.ago }
  end
end
