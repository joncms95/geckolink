# frozen_string_literal: true

class TitleFetcherJob < ApplicationJob
  queue_as :default

  TIMEOUT_SEC = 5
  MAX_BODY_SIZE = 256 * 1024

  def perform(link_id)
    link = Link.find_by(id: link_id)
    return unless link

    body = fetch_body(link.url)
    return unless body

    title = extract_title(body)
    link.update_column(:title, title) if title.present?
  end

  private

  def fetch_body(url)
    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = TIMEOUT_SEC
    http.read_timeout = TIMEOUT_SEC
    response = http.get(uri.request_uri)
    return nil unless response.is_a?(Net::HTTPOK)
    return nil unless html_content?(response)

    body = response.body
    body = body.byteslice(0, MAX_BODY_SIZE) if body.bytesize > MAX_BODY_SIZE
    body = body.dup.force_encoding(Encoding::UTF_8)
    body
  rescue SocketError, OpenSSL::SSL::SSLError, Timeout::Error, URI::InvalidURIError, Errno::ECONNREFUSED
    nil
  end

  def html_content?(response)
    type = response["content-type"].to_s.split(";").first.to_s.strip.downcase
    type == "text/html" || type.end_with?("+html")
  end

  def extract_title(html)
    doc = Nokogiri::HTML(html)
    doc.at_css("title")&.text&.strip&.slice(0, 500)
  end
end
