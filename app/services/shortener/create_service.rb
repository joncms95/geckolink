# frozen_string_literal: true

module Shortener
  class CreateService
    FETCH_TIMEOUT_SEC = 5
    MAX_COLLISION_RETRIES = 3
    DEFAULT_CODE_LENGTH = 7
    FALLBACK_CODE_LENGTH = 8

    def call(original_url:, user_id: nil)
      url = original_url.to_s.strip
      return Result.failure("URL can't be blank") if url.blank?

      link = Link.new(url: url, user_id: user_id)
      return Result.failure(link.errors.full_messages) unless link.valid?

      persist_with_unique_code!(link)
      backfill_metadata(link)
      Result.success(link.reload)
    rescue ActiveRecord::RecordInvalid => e
      Result.failure(e.record.errors.full_messages)
    end

    private

    # Retries with progressively longer codes on collision.
    def persist_with_unique_code!(link)
      (MAX_COLLISION_RETRIES + 1).times do |attempt|
        length = attempt < MAX_COLLISION_RETRIES ? DEFAULT_CODE_LENGTH : FALLBACK_CODE_LENGTH
        link.short_code = RandomCode.generate(length: length)
        link.save!
        return
      rescue ActiveRecord::RecordNotUnique
        link.short_code = nil
      rescue ActiveRecord::RecordInvalid => e
        raise unless e.record.errors[:short_code].any?
        link.short_code = nil
        link.errors.clear
      end

      raise ActiveRecord::RecordInvalid, link
    end

    # Best-effort fetch of page title + icon. Never blocks the response for long.
    def backfill_metadata(link)
      result = Timeout.timeout(FETCH_TIMEOUT_SEC) do
        Metadata::TitleAndIconFetcher.call(link.url, timeout_sec: FETCH_TIMEOUT_SEC)
      end
      return if result.blank?

      updates = {}
      updates[:title] = result[:title] if result[:title].present?
      updates[:icon_url] = result[:icon_url] if result[:icon_url].present?
      link.update_columns(updates) if updates.any?
    rescue Timeout::Error
      # Leave title/icon null — the link is still usable
    end
  end
end
