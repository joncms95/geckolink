# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  has_many :links, dependent: :nullify

  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  # New login regenerates this; other devices' sessions no longer match and get 401.
  def regenerate_session_token
    token = SecureRandom.urlsafe_base64(32)
    update_column(:session_token, token)
    token
  end
end
