# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "requires email" do
      expect(build(:user, email: nil)).not_to be_valid
      expect(build(:user, email: "")).not_to be_valid
    end

    it "requires email to match valid format" do
      expect(build(:user, email: "invalid")).not_to be_valid
      expect(build(:user, email: "user@example.com")).to be_valid
    end

    it "requires unique email" do
      create(:user, email: "same@example.com")
      expect(build(:user, email: "same@example.com")).not_to be_valid
    end

    it "requires password minimum length 8 when password is present" do
      expect(build(:user, password: "short", password_confirmation: "short")).not_to be_valid
      expect(build(:user, password: "longenough", password_confirmation: "longenough")).to be_valid
    end

    it "rejects blank password on create (has_secure_password)" do
      user = User.new(email: "new@example.com", password: "", password_confirmation: "")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end
  end

  describe "associations" do
    it "has many links" do
      user = create(:user)
      create(:link, user_id: user.id)
      expect(user.links.count).to eq(1)
    end

    it "has many sessions" do
      user = create(:user)
      Session.create_token_for_user(user)
      expect(user.sessions.count).to eq(1)
    end
  end

  describe "password digest" do
    it "stores password_digest on create" do
      user = create(:user)
      expect(user.password_digest).to be_present
    end
  end
end
