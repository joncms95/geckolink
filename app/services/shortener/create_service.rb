# frozen_string_literal: true

module Shortener
  class CreateService
    # Synchronous title/icon fetch with timeout. If fetch fails or times out, link is returned with null title/icon.
    FETCH_TIMEOUT_SEC = 5

    def call(original_url:, user_id: nil)
      url = original_url.to_s.strip
      return Result.failure("URL can't be blank") if url.blank?

      link = Link.new(url: url, user_id: user_id)
      return Result.failure(link.errors.full_messages) unless link.valid?

      link.save!
      fetch_title_and_icon(link)
      Result.success(link.reload)
    rescue ActiveRecord::RecordInvalid => e
      Result.failure(e.record.errors.full_messages)
    end

    private

    def fetch_title_and_icon(link)
      result = Timeout.timeout(FETCH_TIMEOUT_SEC) do
        Metadata::TitleAndIconFetcher.call(link.url, timeout_sec: FETCH_TIMEOUT_SEC)
      end
      return if result.blank?

      updates = {}
      updates[:title] = result[:title] if result[:title].present?
      updates[:icon_url] = result[:icon_url] if result[:icon_url].present?
      link.update_columns(updates) if updates.any?
    rescue Timeout::Error
      # Leave title/icon null
    end
  end
end
