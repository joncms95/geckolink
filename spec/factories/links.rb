# frozen_string_literal: true

FactoryBot.define do
  factory :link do
    url { Faker::Internet.url }
    sequence(:short_code) { |n| Shortener::Base62.encode(n) }
    title { Faker::Lorem.sentence }
    clicks_count { 0 }
  end
end
