# frozen_string_literal: true

class Click < ApplicationRecord
  belongs_to :link

  validates :clicked_at, presence: true
end
