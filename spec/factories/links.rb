# frozen_string_literal: true

FactoryBot.define do
  factory :link do
    url { Faker::Internet.url }
    sequence(:short_code) { Shortener::RandomCode.generate(length: 7) }
    title { Faker::Lorem.sentence }
    clicks_count { 0 }
  end
end
