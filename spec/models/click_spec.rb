# frozen_string_literal: true

require "rails_helper"

RSpec.describe Click, type: :model do
  it "belongs to a link" do
    click = create(:click)
    expect(click.link).to be_a(Link)
  end

  it "validates presence of clicked_at" do
    click = build(:click, clicked_at: nil)
    expect(click).not_to be_valid
  end
end
