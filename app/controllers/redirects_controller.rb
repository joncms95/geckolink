# frozen_string_literal: true

class RedirectsController < ApplicationController
  SAFE_REDIRECT_REGEX = %r{\Ahttps?://[^\s]+\z}i

  def show
    link = Link.find_by!(short_code: params[:short_code])
    link.increment!(:clicks_count)
    VisitTrackerJob.perform_later(
      link_id: link.id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
    )

    if link.url.match?(SAFE_REDIRECT_REGEX)
      redirect_to link.url, allow_other_host: true, status: :found
    else
      head :unprocessable_entity
    end
  end
end
