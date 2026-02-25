# frozen_string_literal: true

class RedirectsController < ApplicationController
  def show
    result = Redirect::ResolveService.call(key: params[:key])
    return head :not_found unless result.success?

    redirect_url = safe_redirect_url(result.value[:url])
    return head :unprocessable_content unless redirect_url

    Link.increment_counter(:clicks_count, result.value[:link_id])
    RecordClickJob.perform_later(
      link_id: result.value[:link_id],
      ip_address: request.remote_ip,
      user_agent: request.user_agent
    )

    redirect_to redirect_url, allow_other_host: true, status: :found
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
