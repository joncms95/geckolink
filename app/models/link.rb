# frozen_string_literal: true

class Link < ApplicationRecord
  belongs_to :user, optional: true
  has_many :clicks, dependent: :destroy

  before_validation :normalize_target_url

  validates :target_url, presence: true, format: { with: %r{\Ahttps?://[^\s]+\z}i, message: "must be http or https URL" }
  validate :target_url_must_have_valid_host
  validates :key, uniqueness: true, allow_nil: true, length: { maximum: 15 }
  validates :clicks_count, numericality: { greater_than_or_equal_to: 0 }

  private

  def normalize_target_url
    return if target_url.blank?

    u = target_url.to_s.strip
    u = "https://#{u}" if u.present? && !u.match?(%r{\Ahttps?://}i)
    self.target_url = u
  end

  def target_url_must_have_valid_host
    return if target_url.blank? || target_url !~ %r{\Ahttps?://}i

    uri = URI.parse(target_url)
    host = uri.host.presence || uri.opaque.to_s.split("/").first
    return if host.blank?

    return if host == "localhost" || host.include?(".")

    errors.add(:target_url, "must have a valid domain (e.g. example.com)")
  rescue URI::InvalidURIError
    errors.add(:target_url, "is not a valid URL")
  end
end
