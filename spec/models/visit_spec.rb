# frozen_string_literal: true

require "rails_helper"

RSpec.describe Visit, type: :model do
  it "belongs to a link" do
    visit = create(:visit)
    expect(visit.link).to be_a(Link)
  end

  it "validates presence of visited_at" do
    visit = build(:visit, visited_at: nil)
    expect(visit).not_to be_valid
  end
end
