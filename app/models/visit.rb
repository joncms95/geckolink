# frozen_string_literal: true

class Visit < ApplicationRecord
  belongs_to :link

  validates :visited_at, presence: true
end
