# frozen_string_literal: true

class Link < ApplicationRecord
  belongs_to :user, optional: true
  has_many :visits, dependent: :destroy

  before_validation :normalize_url
  after_create :assign_short_code

  validates :url, presence: true, format: { with: %r{\Ahttps?://[^\s]+\z}i, message: "must be http or https URL" }
  validate :url_must_have_valid_host
  validates :short_code, uniqueness: true, allow_nil: true, length: { maximum: 15 }
  validates :clicks_count, numericality: { greater_than_or_equal_to: 0 }

  private

  def normalize_url
    return if url.blank?

    u = url.to_s.strip
    u = "https://#{u}" if u.present? && !u.match?(%r{\Ahttps?://}i)
    self.url = u
  end

  def url_must_have_valid_host
    return if url.blank? || url !~ %r{\Ahttps?://}i

    uri = URI.parse(url)
    host = uri.host.presence || uri.opaque.to_s.split("/").first
    return if host.blank?

    return if host == "localhost" || host.include?(".")

    errors.add(:url, "must have a valid domain (e.g. example.com)")
  rescue URI::InvalidURIError
    errors.add(:url, "is not a valid URL")
  end

  def assign_short_code
    update_column(:short_code, Shortener::Base62.encode(id))
  end
end
