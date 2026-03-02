# frozen_string_literal: true

module Metadata
  # Fetches a URL's HTML and extracts its title and favicon.
  #
  # Always returns { title:, icon_url: } on success (either may be nil).
  # Falls back to DuckDuckGo favicon when the page can't be fetched or has no usable icon.
  # Same-origin icons are replaced with DuckDuckGo URLs to avoid CORS/redirect issues in-app.
  class TitleAndIconFetcher
    TIMEOUT = 4
    MAX_BODY_SIZE = 256 * 1024
    MAX_MANIFEST_SIZE = 64 * 1024
    MAX_REDIRECTS = 5
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    DUCKDUCKGO_FAVICON = "https://icons.duckduckgo.com/ip3"
    DUCKDUCKGO_CHECK_TIMEOUT = 2
    PREFERRED_ICON_SIZES = [192, 96, 32].freeze
    DEFAULT_ICON_SIZE = 192
    MAX_TITLE_LENGTH = 500

    NETWORK_ERRORS = [
      SocketError, OpenSSL::SSL::SSLError, Timeout::Error,
      Net::OpenTimeout, Net::ReadTimeout, URI::InvalidURIError,
      Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::EHOSTUNREACH,
      Errno::ETIMEDOUT, Errno::EPIPE, IOError
    ].freeze

    # @return [Result] { title: String|nil, icon_url: String|nil }; failure only for invalid URL
    def self.call(url)
      new(url).call
    end

    def initialize(url)
      @original_url = url
      @uri = normalize_url(@original_url)
      @final_uri = nil
      @doc = nil
    end

    def call
      return Result.failure("Invalid URL") unless @uri

      load_page_content

      Result.success(
        title: extract_title,
        icon_url: resolve_icon
      )
    end

    private

    def load_page_content
      html_body, @final_uri = fetch_html(@uri)
      @final_uri ||= @uri

      return unless html_body

      @doc = Nokogiri::HTML(scrub_encoding(html_body))
    end

    # --- Title extraction ---

    def extract_title
      return nil unless @doc

      # Evaluates sequentially; stops at the first truthy value.
      raw_title = text_from_css("title") ||
                  content_from_meta("property", "og:title") ||
                  content_from_meta("name", "twitter:title") ||
                  content_from_meta("name", "application-name") ||
                  content_from_meta("name", "title") ||
                  content_from_meta("property", "og:site_name") ||
                  fallback_meta_title

      truncate(raw_title)
    end

    def text_from_css(selector)
      @doc.at_css(selector)&.text
    end

    def content_from_meta(attr, value)
      node = @doc.at_css("meta[#{attr}=\"#{value}\"]")
      node&.[]("content").presence || node&.[]("value")
    end

    def fallback_meta_title
      @doc.css('meta[name*="title"], meta[property*="title"]').find do |node|
        content = node["content"].presence || node["value"]
        break content if content.to_s.strip.present?
      end
    end

    def truncate(raw_string, max = MAX_TITLE_LENGTH)
      raw_string&.strip&.slice(0, max).presence
    end

    # --- Icon extraction ---

    def resolve_icon
      icon_from_manifest || icon_from_html || duckduckgo_icon
    end

    def icon_from_manifest
      return nil unless @doc

      manifest_href = @doc.at_css('link[rel="manifest"]')&.[]("href")&.strip
      return nil if manifest_href.blank?

      manifest_uri = URI.join(@final_uri, manifest_href)
      manifest_json = fetch_json(manifest_uri)
      return nil unless manifest_json

      icon_entries = parse_manifest_icons(manifest_json)
      best_entry = select_best_icon(icon_entries)
      return nil unless best_entry

      cross_origin_only(URI.join(manifest_uri, best_entry["src"]).to_s)
    rescue JSON::ParserError, URI::InvalidURIError
      nil
    end

    def icon_from_html
      return nil unless @doc

      icon_links = @doc.css("link[rel*='icon']").select { |link| link["href"].to_s.strip.present? }
      return nil if icon_links.empty?

      best_link = select_best_icon(icon_links) { |link| max_dimension_from(link["sizes"].to_s) }

      cross_origin_only(URI.join(@final_uri, best_link["href"].to_s.strip).to_s)
    rescue URI::InvalidURIError
      nil
    end

    def cross_origin_only(icon_url)
      icon_uri = URI.parse(icon_url)

      return nil unless icon_uri.host
      return nil if canonical_host(icon_uri) == canonical_host(@final_uri)

      icon_url
    rescue URI::InvalidURIError
      nil
    end

    # --- DuckDuckGo Fallback Logic ---

    def duckduckgo_icon
      current_host = @final_uri.host.downcase
      alternate_host = current_host.start_with?("www.") ? current_host.sub(/\Awww\./, "") : "www.#{current_host}"

      resolved_host = [current_host, alternate_host].uniq.find { |h| duckduckgo_host_valid?(h) } || current_host

      "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(resolved_host)}.ico"
    end

    def duckduckgo_host_valid?(host)
      path = "/ip3/#{URI.encode_www_form_component(host)}.ico"
      duckduckgo_uri = URI.parse(DUCKDUCKGO_FAVICON)

      http = Net::HTTP.new(duckduckgo_uri.host, duckduckgo_uri.port)
      http.use_ssl = true
      http.open_timeout = DUCKDUCKGO_CHECK_TIMEOUT
      http.read_timeout = DUCKDUCKGO_CHECK_TIMEOUT

      response = http.head(path)
      response.is_a?(Net::HTTPOK)
    rescue *NETWORK_ERRORS
      false
    end

    # --- Icon Sizing Helpers ---

    def parse_manifest_icons(manifest_json)
      Array(JSON.parse(manifest_json)["icons"])
        .select { |entry| entry["src"].present? }
        .select { |entry| entry["purpose"].to_s.blank? || entry["purpose"].to_s.split.include?("any") }
    end

    def select_best_icon(candidates)
      candidates.max_by do |icon|
        # Block: HTML link nodes; no block: manifest icon hashes
        size = block_given? ? yield(icon) : max_dimension_from(icon["sizes"].to_s)
        size = DEFAULT_ICON_SIZE if size <= 0

        [icon_size_score(size), size]
      end
    end

    def icon_size_score(size)
      PREFERRED_ICON_SIZES.map { |preferred| -(size - preferred).abs }.max
    end

    def max_dimension_from(sizes_attribute)
      sizes_attribute.split(/\s+/).filter_map do |part|
        next unless part =~ /\A(\d+)x(\d+)\z/i
        [$1.to_i, $2.to_i].max
      end.max || 0
    end

    # --- HTTP and URL networking ---

    def normalize_url(url)
      url_string = url.to_s.strip
      return nil if url_string.blank?

      url_string = "https://#{url_string}" unless url_string.match?(%r{\Ahttps?://}i)
      parsed = URI.parse(url_string)
      parsed.host ? parsed : nil
    rescue URI::InvalidURIError
      nil
    end

    def canonical_host(uri)
      uri.host.downcase.sub(/\Awww\./, "")
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

    def fetch_json(uri)
      response, _final_uri = fetch_resource(
        uri: uri,
        accept: "application/json, */*",
        max_size: MAX_MANIFEST_SIZE
      )

      response ? scrub_encoding(response.body) : nil
    end

    # Unified HTTP request handler that manages redirects and size limits
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
