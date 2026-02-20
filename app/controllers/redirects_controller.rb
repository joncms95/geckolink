# frozen_string_literal: true

class RedirectsController < ApplicationController
  def show
    link = Link.find_by!(short_code: params[:short_code])
    link.increment!(:clicks_count)
    VisitTrackerJob.perform_later(
      link_id: link.id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
    )

    redirect_url = safe_redirect_url(link.url)
    if redirect_url
      redirect_to redirect_url, allow_other_host: true, status: :found
    else
      head :unprocessable_content
    end
  end

  private

  def safe_redirect_url(url)
    uri = URI.parse(url)
    return unless uri.is_a?(URI::HTTP) && uri.host.present?

    uri.to_s
  rescue URI::InvalidURIError
    nil
  end
end
