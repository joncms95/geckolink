# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  has_many :links, dependent: :nullify

  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
end
