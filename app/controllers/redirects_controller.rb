# frozen_string_literal: true

class RedirectsController < ApplicationController
  def show
    result = Redirect::ResolveService.new.call(short_code: params[:short_code])

    unless result.success?
      return head :not_found
    end

    record_visit(result.value[:link_id])
    redirect_url = safe_redirect_url(result.value[:url])

    if redirect_url
      redirect_to redirect_url, allow_other_host: true, status: :found
    else
      head :unprocessable_content
    end
  end

  private

  def record_visit(link_id)
    Link.increment_counter(:clicks_count, link_id)
    Analytics::RecordVisit.call(
      link_id: link_id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent
    )
  end

  def safe_redirect_url(url)
    uri = URI.parse(url)
    return unless uri.is_a?(URI::HTTP) && uri.host.present?

    uri.to_s
  rescue URI::InvalidURIError
    nil
  end
end
