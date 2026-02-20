# frozen_string_literal: true

module Shortener
  class CreateService
    def call(original_url:)
      url = original_url.to_s.strip
      return Result.failure("URL can't be blank") if url.blank?

      link = Link.new(url: url)
      return Result.failure(link.errors.full_messages) unless link.valid?

      link.save!
      Result.success(link)
    rescue ActiveRecord::RecordInvalid => e
      Result.failure(e.record.errors.full_messages)
    end
  end
end
