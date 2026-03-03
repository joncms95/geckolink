# frozen_string_literal: true

module Metadata
  class TitleAndIconFetcher
    TIMEOUT = 4
    MAX_BODY_SIZE = 256 * 1024
    MAX_REDIRECTS = 5
    MAX_TITLE_LENGTH = 100
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    DUCKDUCKGO_FAVICON = "https://icons.duckduckgo.com/ip3"
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
      @uri = normalize_url(url)
      @final_uri = nil
      @doc = nil
    end

    def call
      return Result.failure("Invalid URL") unless @uri

      load_page_content

      Result.success(
        title: extract_title,
        icon_url: duckduckgo_icon
      )
    end

    private

    def load_page_content
      html_body, @final_uri = fetch_html(@uri)
      @final_uri ||= @uri

      return unless html_body

      @doc = Nokogiri::HTML(scrub_encoding(html_body))
    end

    def extract_title
      return nil unless @doc

      raw = text_from_css("title") ||
            content_from_meta("property", "og:title") ||
            content_from_meta("name", "twitter:title")

      truncate(raw)
    end

    def text_from_css(selector)
      @doc.at_css(selector)&.text
    end

    def content_from_meta(attr, value)
      node = @doc.at_css("meta[#{attr}=\"#{value}\"]")
      node&.[]("content").presence || node&.[]("value")
    end

    def truncate(raw_string, max = MAX_TITLE_LENGTH)
      raw_string&.strip&.slice(0, max).presence
    end

    def duckduckgo_icon
      host = @final_uri.host.to_s.downcase
      "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(host)}.ico"
    end

    def normalize_url(url)
      url_string = url.to_s.strip
      return nil if url_string.blank?

      url_string = "https://#{url_string}" unless url_string.match?(%r{\Ahttps?://}i)
      parsed = URI.parse(url_string)
      parsed.host ? parsed : nil
    rescue URI::InvalidURIError
      nil
    end

    def fetch_html(uri, redirects = 0)
      response, final_uri = fetch_resource(
        uri: uri,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        max_size: MAX_BODY_SIZE,
        redirects: redirects
      )

      return nil unless response && html_content_type?(response)
      [response.body, final_uri]
    end

    def fetch_resource(uri:, accept:, max_size:, redirects: 0)
      return nil if redirects > MAX_REDIRECTS

      request = Net::HTTP::Get.new(uri.request_uri).tap do |r|
        r["User-Agent"] = USER_AGENT
        r["Accept"] = accept
        r["Accept-Language"] = "en-US,en;q=0.9"
      end

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == "https")
      http.open_timeout = TIMEOUT
      http.read_timeout = TIMEOUT

      response = http.request(request)

      case response
      when Net::HTTPOK
        response.body = response.body.byteslice(0, max_size) if response.body.bytesize > max_size
        [response, uri]
      when Net::HTTPRedirection
        redirect_location = response["location"]
        return nil if redirect_location.blank?

        fetch_resource(uri: URI.join(uri, redirect_location), accept: accept, max_size: max_size, redirects: redirects + 1)
      else
        nil
      end
    rescue *NETWORK_ERRORS
      nil
    end

    def html_content_type?(response)
      content_type = response["content-type"].to_s.split(";").first.to_s.strip.downcase
      content_type == "text/html" || content_type == "application/xhtml+xml" || content_type.end_with?("+html")
    end

    def scrub_encoding(body)
      body = body.dup.force_encoding(Encoding::UTF_8)
      body.valid_encoding? ? body : body.encode(Encoding::UTF_8, invalid: :replace, undef: :replace)
    end
  end
end
