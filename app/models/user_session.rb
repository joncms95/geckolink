# frozen_string_literal: true

# One record per device/browser session. Allows multiple concurrent sessions per user.
class UserSession < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true

  # Creates a new session for the user and returns the token to store in the cookie.
  def self.create_for_user(user)
    token = SecureRandom.urlsafe_base64(32)
    create!(user: user, token: token)
    token
  end
end
