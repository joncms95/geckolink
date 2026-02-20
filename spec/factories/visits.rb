# frozen_string_literal: true

FactoryBot.define do
  factory :visit do
    association :link
    ip_address { Faker::Internet.ip_v4_address }
    user_agent { Faker::Internet.user_agent }
    geolocation { "#{Faker::Address.city}, #{Faker::Address.country}" }
    country { Faker::Address.country }
    visited_at { 1.hour.ago }
  end
end
