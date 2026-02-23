# frozen_string_literal: true

FactoryBot.define do
  factory :link do
    target_url { Faker::Internet.url }
    sequence(:key) { |n| Shortener::RandomKey.generate(length: 7) }
    title { Faker::Lorem.sentence }
    clicks_count { 0 }
  end
end
