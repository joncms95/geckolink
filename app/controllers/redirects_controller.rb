# frozen_string_literal: true

class RedirectsController < ApplicationController
  REDIRECT_CACHE_TTL = 5.minutes

  def show
    short_code = params[:short_code]
    cached = Rails.cache.read(redirect_cache_key(short_code))

    if cached
      link_id = cached["link_id"]
      target_url = cached["url"]
    else
      link = Link.find_by!(short_code: short_code)
      link_id = link.id
      target_url = link.url
      Rails.cache.write(redirect_cache_key(short_code), { "link_id" => link_id, "url" => target_url }, expires_in: REDIRECT_CACHE_TTL)
    end

    Link.increment_counter(:clicks_count, link_id)
    Analytics::RecordVisit.call(
      link_id: link_id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
    )

    redirect_url = safe_redirect_url(target_url)
    if redirect_url
      redirect_to redirect_url, allow_other_host: true, status: :found
    else
      head :unprocessable_content
    end
  end

  private

  def redirect_cache_key(short_code)
    "redirect/#{short_code}"
  end

  def safe_redirect_url(url)
    uri = URI.parse(url)
    return unless uri.is_a?(URI::HTTP) && uri.host.present?

    uri.to_s
  rescue URI::InvalidURIError
    nil
  end
end
