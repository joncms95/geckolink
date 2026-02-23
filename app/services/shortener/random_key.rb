# frozen_string_literal: true

module Shortener
  # Generates random alphanumeric short keys using CSPRNG.
  # Alphabet: [A-Z, a-z, 0-9] (62 chars). Default length 7 → 62^7 ≈ 3.5 trillion combinations.
  # See docs/WIKI.md for design rationale and collision analysis.
  module RandomKey
    ALPHABET = ("0".."9").to_a.concat(("a".."z").to_a).concat(("A".."Z").to_a).join.freeze
    BASE = ALPHABET.length # 62

    module_function

    def generate(length: 7)
      bytes = SecureRandom.random_bytes(length)
      bytes.each_byte.map { |b| ALPHABET[b % BASE] }.join
    end
  end
end
