# frozen_string_literal: true

# One record per device/browser session. Allows multiple concurrent sessions per user.
class Session < ApplicationRecord
  belongs_to :user

  validates :token_digest, presence: true, uniqueness: true

  # Creates a new session for the user and returns the raw token for the client.
  def self.create_token_for_user(user)
    token = SecureRandom.urlsafe_base64(32)
    create!(user: user, token_digest: Digest::SHA256.hexdigest(token))
    token
  end

  def self.find_by_token(raw_token)
    return nil if raw_token.blank?
    find_by(token_digest: Digest::SHA256.hexdigest(raw_token))
  end
end
