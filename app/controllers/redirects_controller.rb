# frozen_string_literal: true

class RedirectsController < ApplicationController
  def show
    link = Link.find_by!(short_code: params[:short_code])
    link.increment!(:clicks_count)
    redirect_to link.url, allow_other_host: true, status: :found
  end
end
