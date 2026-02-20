# frozen_string_literal: true

module Shortener
  module Base62
    ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".freeze
    BASE = 62

    module_function

    def encode(n)
      return ALPHABET[0] if n.nil? || n.zero?

      s = +""
      while n.positive?
        s << ALPHABET[n % BASE]
        n /= BASE
      end
      s.reverse
    end

    def decode(s)
      s.each_char.reduce(0) { |acc, c| acc * BASE + ALPHABET.index(c) }
    end
  end
end
