# frozen_string_literal: true

module Shortener
  # Generates random alphanumeric short keys using SecureRandom (uniform distribution).
  # Alphabet: [A-Z, a-z, 0-9] (62 chars). Default length 7 → 62^7 ≈ 3.5 trillion combinations.
  module RandomKey
    module_function

    def generate(length: 7)
      SecureRandom.alphanumeric(length)
    end
  end
end
