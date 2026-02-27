# frozen_string_literal: true

require "rails_helper"

RSpec.describe Session, type: :model do
  describe "validations" do
    it "requires token_digest" do
      user = create(:user)
      expect(build(:session, user: user, token_digest: nil)).not_to be_valid
    end

    it "requires unique token_digest" do
      user = create(:user)
      digest = Digest::SHA256.hexdigest(SecureRandom.urlsafe_base64(32))
      create(:session, user: user, token_digest: digest)
      expect(build(:session, user: create(:user), token_digest: digest)).not_to be_valid
    end
  end

  describe "associations" do
    it "belongs to user" do
      user = create(:user)
      raw_token = Session.create_token_for_user(user)
      found = Session.find_by_token(raw_token)
      expect(found).to be_a(Session)
      expect(found.user).to eq(user)
    end
  end

  describe ".create_token_for_user" do
    it "creates a session and returns the raw token" do
      user = create(:user)
      token = Session.create_token_for_user(user)
      expect(token).to be_present
      expect(token.length).to be >= 32
      expect(Session.count).to eq(1)
      expect(Session.last.token_digest).to eq(Digest::SHA256.hexdigest(token))
    end
  end

  describe ".find_by_token" do
    it "returns the session when given the raw token" do
      user = create(:user)
      raw_token = Session.create_token_for_user(user)
      found = Session.find_by_token(raw_token)
      expect(found).to eq(Session.last)
    end

    it "returns nil when raw token is blank" do
      expect(Session.find_by_token(nil)).to be_nil
      expect(Session.find_by_token("")).to be_nil
    end

    it "returns nil when no session matches the token" do
      expect(Session.find_by_token("nonexistent-token")).to be_nil
    end
  end
end
