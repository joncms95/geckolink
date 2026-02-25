# frozen_string_literal: true

module Shortener
  class CreateService
    DEFAULT_KEY_LENGTH = 7
    FALLBACK_KEY_LENGTH = 8
    MAX_COLLISION_RETRIES = 3
    METADATA_TIMEOUT_SEC = 8

    def self.call(original_url:, user_id: nil)
      url = original_url.to_s.strip
      return Result.failure("URL can't be blank") if url.blank?

      link = Link.new(target_url: url, user_id: user_id)
      return Result.failure(link.errors.full_messages) unless link.valid?

      persist_with_unique_key!(link)
      backfill_metadata(link)

      Result.success(link.reload)
    rescue ActiveRecord::RecordInvalid => e
      Result.failure(e.record.errors.full_messages)
    end

    class << self
      private

      def persist_with_unique_key!(link)
        (MAX_COLLISION_RETRIES + 1).times do |attempt|
          length = attempt < MAX_COLLISION_RETRIES ? DEFAULT_KEY_LENGTH : FALLBACK_KEY_LENGTH
          link.key = RandomKey.generate(length: length)
          link.save!
          return
        rescue ActiveRecord::RecordNotUnique
          link.key = nil
        rescue ActiveRecord::RecordInvalid => e
          raise unless e.record.errors[:key].any?
          link.key = nil
          link.errors.clear
        end

        raise ActiveRecord::RecordInvalid, link
      end

      def backfill_metadata(link)
        result = Timeout.timeout(METADATA_TIMEOUT_SEC) do
          Metadata::TitleAndIconFetcher.call(link.target_url)
        end
        return if result.failure?

        metadata = result.value
        updates = metadata.slice(:title, :icon_url).compact_blank
        link.update_columns(updates) if updates.any?
      rescue Timeout::Error => e
        Rails.logger.warn("[Shortener::CreateService] Metadata fetch timed out for #{link.target_url}: #{e.message}")
      end
    end
  end
end
