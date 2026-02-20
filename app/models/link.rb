# frozen_string_literal: true

class Link < ApplicationRecord
  has_many :visits, dependent: :destroy

  after_create :assign_short_code

  validates :url, presence: true, format: { with: %r{\Ahttps?://[^\s]+\z}i, message: "must be http or https URL" }
  validates :short_code, uniqueness: true, allow_nil: true
  validates :clicks_count, numericality: { greater_than_or_equal_to: 0 }

  private

  def assign_short_code
    update_column(:short_code, Shortener::Base62.encode(id))
  end
end
