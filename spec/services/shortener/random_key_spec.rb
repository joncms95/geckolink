# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shortener::RandomKey do
  describe ".generate" do
    it "returns a string of default length 7" do
      code = described_class.generate
      expect(code).to match(/\A[0-9a-zA-Z]{7}\z/)
    end

    it "returns a string of specified length" do
      expect(described_class.generate(length: 8)).to match(/\A[0-9a-zA-Z]{8}\z/)
      expect(described_class.generate(length: 5)).to match(/\A[0-9a-zA-Z]{5}\z/)
    end

    it "uses only A-Z, a-z, 0-9" do
      20.times do
        code = described_class.generate(length: 7)
        expect(code).to match(/\A[0-9a-zA-Z]+\z/)
      end
    end

    it "generates different codes (CSPRNG)" do
      codes = 100.times.map { described_class.generate }
      expect(codes.uniq.size).to eq(100)
    end
  end
end
