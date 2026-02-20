# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shortener::Base62 do
  describe ".encode" do
    it "encodes 0 as first character" do
      expect(described_class.encode(0)).to eq("0")
    end

    it "encodes 1 as second character" do
      expect(described_class.encode(1)).to eq("1")
    end

    it "encodes 61 as single character Z" do
      expect(described_class.encode(61)).to eq("Z")
    end

    it "encodes 62 as two characters" do
      expect(described_class.encode(62)).to eq("10")
    end
  end

  describe ".decode" do
    it "decodes back to original" do
      [ 1, 62, 123, 3844 ].each do |n|
        expect(described_class.decode(described_class.encode(n))).to eq(n)
      end
    end
  end
end
