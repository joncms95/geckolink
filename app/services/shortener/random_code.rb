# frozen_string_literal: true

module Shortener
  # Generates random alphanumeric short codes using CSPRNG (Approach D in WIKI).
  # Alphabet: [A-Z, a-z, 0-9]. Default length 7 gives 62^7 (~3.5 trillion) combinations.
  module RandomCode
    ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".freeze

    module_function

    def generate(length: 7)
      length.times.map { ALPHABET[SecureRandom.random_number(ALPHABET.length)] }.join
    end
  end
end
