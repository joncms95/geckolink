# frozen_string_literal: true

FactoryBot.define do
  factory :session do
    association :user
    token_digest { Digest::SHA256.hexdigest(SecureRandom.urlsafe_base64(32)) }
  end
end
