# frozen_string_literal: true

module Metadata
  class TitleAndIconFetcher
    TIMEOUT = 4
    MAX_BODY_SIZE = 256 * 1024
    MAX_REDIRECTS = 5
    MAX_TITLE_LENGTH = 100
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".freeze
    DUCKDUCKGO_FAVICON = "https://icons.duckduckgo.com/ip3".freeze

    NETWORK_ERRORS = [
      SocketError, OpenSSL::SSL::SSLError, Timeout::Error,
      Net::OpenTimeout, Net::ReadTimeout, URI::InvalidURIError,
      Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::EHOSTUNREACH,
      Errno::ETIMEDOUT, Errno::EPIPE, IOError
    ].freeze

    def self.call(url)
      new(url).call
    end

    def initialize(url)
      @url = url
    end

    def call
      uri = normalize_url(@url)
      return Result.failure("Invalid URL") unless uri

      html_body = fetch_html(uri)
      title = html_body ? extract_title(html_body) : nil

      Result.success(
        title: title,
        icon_url: duckduckgo_icon(uri)
      )
    end

    private

    # --- Network Logic ---

    def fetch_html(uri, redirects = 0)
      return nil if redirects > MAX_REDIRECTS

      http = build_http_client(uri)
      request = build_request(uri)

      body = nil
      http.request(request) do |response|
        case response
        when Net::HTTPOK
          return nil unless valid_content_type?(response)

          body = read_limited_body(response)
        when Net::HTTPRedirection
          redirect_location = response["location"]
          return nil if redirect_location.blank?

          redirect_uri = URI.join(uri, redirect_location)
          body = fetch_html(redirect_uri, redirects + 1)
        end
      end

      body
    rescue *NETWORK_ERRORS
      nil
    end

    def build_http_client(uri)
      Net::HTTP.new(uri.host, uri.port).tap do |http|
        http.use_ssl = (uri.scheme == "https")
        http.open_timeout = TIMEOUT
        http.read_timeout = TIMEOUT
      end
    end

    def build_request(uri)
      Net::HTTP::Get.new(uri.request_uri).tap do |r|
        r["User-Agent"] = USER_AGENT
        r["Accept"] = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
        r["Accept-Language"] = "en-US,en;q=0.9"
      end
    end

    def valid_content_type?(response)
      content_type = response["content-type"].to_s.split(";").first.to_s.strip.downcase
      %w[text/html application/xhtml+xml].include?(content_type) || content_type.end_with?("+html")
    end

    def read_limited_body(response)
      body = String.new
      response.read_body do |chunk|
        body << chunk
        # Break early to prevent downloading massive files into memory
        break if body.bytesize >= MAX_BODY_SIZE
      end
      body.byteslice(0, MAX_BODY_SIZE)
    end

    # --- DOM Parsing Logic ---

    def extract_title(html_body)
      doc = Nokogiri::HTML(scrub_encoding(html_body))

      raw = text_from_css(doc, "title") ||
            content_from_meta(doc, "property", "og:title") ||
            content_from_meta(doc, "property", "og:site_name") ||
            content_from_meta(doc, "name", "twitter:title")

      truncate(raw)
    end

    def text_from_css(doc, selector)
      doc.at_css(selector)&.text
    end

    def content_from_meta(doc, attr, value)
      node = doc.at_css("meta[#{attr}=\"#{value}\"]")
      node&.[]("content").presence || node&.[]("value")
    end

    def truncate(raw_string)
      raw_string&.strip&.slice(0, MAX_TITLE_LENGTH).presence
    end

    def scrub_encoding(body)
      safe_body = body.dup.force_encoding(Encoding::UTF_8)
      safe_body.valid_encoding? ? safe_body : safe_body.encode(Encoding::UTF_8, invalid: :replace, undef: :replace)
    end

    # --- Utility Logic ---

    def normalize_url(url)
      url_string = url.to_s.strip
      return nil if url_string.blank?

      url_string = "https://#{url_string}" unless url_string.match?(%r{\Ahttps?://}i)
      parsed = URI.parse(url_string)
      parsed.host ? parsed : nil
    rescue URI::InvalidURIError
      nil
    end

    def duckduckgo_icon(uri)
      host = uri.host.to_s.downcase
      "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(host)}.ico"
    end
  end
end
