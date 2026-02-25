# frozen_string_literal: true

module Metadata
  # Fetches HTML from a URL and extracts title + icon URL.
  #
  # Flow: normalize URL → fetch HTML → extract title + resolve icon.
  # On fetch failure (timeout, non-HTML, error): returns DuckDuckGo icon only (no title).
  # On success: title from <title> / og:title / twitter:title (nil when absent),
  # icon from manifest → HTML <link> → DuckDuckGo (same-origin icons replaced with DuckDuckGo
  # since they often fail in-app due to CORS/redirects).
  class TitleAndIconFetcher
    DEFAULT_TIMEOUT = 4
    MAX_BODY_SIZE = 256 * 1024
    MAX_MANIFEST_SIZE = 64 * 1024
    MAX_REDIRECTS = 5
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    DUCKDUCKGO_FAVICON = "https://icons.duckduckgo.com/ip3"
    DUCKDUCKGO_CHECK_TIMEOUT = 2
    PREFERRED_ICON_SIZES = [192, 96, 32].freeze
    NETWORK_ERRORS = [
      SocketError, OpenSSL::SSL::SSLError, Timeout::Error,
      Net::OpenTimeout, Net::ReadTimeout,
      URI::InvalidURIError, Errno::ECONNREFUSED,
      Errno::ECONNRESET, Errno::EHOSTUNREACH,
      Errno::ETIMEDOUT, Errno::EPIPE, IOError
    ].freeze

    def self.call(url, timeout_sec: DEFAULT_TIMEOUT)
      new(timeout_sec: timeout_sec).call(url)
    end

    def initialize(timeout_sec: DEFAULT_TIMEOUT)
      @timeout_sec = timeout_sec
    end

    # @return [Hash, nil] { title: String, icon_url: String } or nil when URL is invalid
    def call(url)
      uri = normalize_and_parse(url)
      return nil unless uri

      body, page_uri = fetch_html(uri)
      return { icon_url: duckduckgo_icon(uri) } unless body

      doc = Nokogiri::HTML(scrub_encoding(body))
      title = extract_title(doc)
      icon_url = resolve_icon(doc, page_uri)

      result = {}
      result[:title] = title if title
      result[:icon_url] = icon_url if icon_url
      result.presence
    end

    private

    # --- URL ---

    def normalize_and_parse(url)
      s = url.to_s.strip
      return nil if s.blank?

      s = "https://#{s}" unless s.match?(%r{\Ahttps?://}i)
      uri = URI.parse(s)
      uri.host ? uri : nil
    rescue URI::InvalidURIError
      nil
    end

    def canonical_host(uri)
      uri.host.to_s.downcase.sub(/\Awww\./, "")
    end

    # --- HTTP ---

    def fetch_html(uri, redirects = 0)
      return nil if redirects > MAX_REDIRECTS

      response = http_get(uri, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")

      case response
      when Net::HTTPOK
        return nil unless html_response?(response)

        body = response.body
        body = body.byteslice(0, MAX_BODY_SIZE) if body.bytesize > MAX_BODY_SIZE
        [body, uri]
      when Net::HTTPRedirection
        location = response["location"]
        return nil if location.blank?

        fetch_html(URI.join(uri, location), redirects + 1)
      end
    rescue *NETWORK_ERRORS
      nil
    end

    def fetch_json(uri)
      response = http_get(uri, accept: "application/json, */*")
      return nil unless response.is_a?(Net::HTTPOK)

      body = response.body
      body = body.byteslice(0, MAX_MANIFEST_SIZE) if body.bytesize > MAX_MANIFEST_SIZE
      scrub_encoding(body)
    rescue *NETWORK_ERRORS
      nil
    end

    def http_get(uri, accept:)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = @timeout_sec
      http.read_timeout = @timeout_sec

      req = Net::HTTP::Get.new(uri.request_uri)
      req["User-Agent"] = USER_AGENT
      req["Accept"] = accept
      req["Accept-Language"] = "en-US,en;q=0.9"
      http.request(req)
    end

    def html_response?(response)
      type = response["content-type"].to_s.split(";").first.to_s.strip.downcase
      type == "text/html" || type == "application/xhtml+xml" || type.end_with?("+html")
    end

    def scrub_encoding(body)
      body = body.dup.force_encoding(Encoding::UTF_8)
      body.valid_encoding? ? body : body.encode(Encoding::UTF_8, invalid: :replace, undef: :replace)
    end

    # --- Title ---

    def extract_title(doc)
      truncate(doc.at_css("title")&.text) ||
        truncate(doc.at_css('meta[property="og:title"]')&.[]("content")) ||
        truncate(doc.at_css('meta[name="twitter:title"]')&.[]("content"))
    end

    def truncate(raw, max = 500)
      raw&.strip&.slice(0, max).presence
    end

    # --- Icon ---

    def resolve_icon(doc, page_uri)
      icon_from_manifest(doc, page_uri) ||
        icon_from_html(doc, page_uri) ||
        duckduckgo_icon(page_uri)
    end

    def icon_from_manifest(doc, page_uri)
      href = doc.at_css('link[rel="manifest"]')&.[]("href")&.strip&.presence
      return nil unless href

      manifest_uri = URI.join(page_uri, href)
      body = fetch_json(manifest_uri)
      return nil unless body

      icons = Array(JSON.parse(body)["icons"]).select { |i| i["src"].present? }
      usable = icons.select { |i| i["purpose"].to_s.blank? || i["purpose"].to_s.split.include?("any") }
      usable = icons if usable.empty?
      return nil if usable.empty?

      best = best_by_size(usable) { |i| i["sizes"].to_s.split.map(&:to_i).max || 0 }
      src = best["src"].to_s.strip
      return nil if src.blank?

      use_if_cross_origin(URI.join(manifest_uri, src).to_s, page_uri)
    rescue JSON::ParserError, URI::InvalidURIError
      nil
    end

    def icon_from_html(doc, page_uri)
      nodes = doc.css("link[rel*='icon']").select { |n| n["href"].to_s.strip.present? }
      return nil if nodes.empty?

      best = best_by_size(nodes) { |n| parse_sizes(n["sizes"].to_s).max || 0 }
      href = best["href"].to_s.strip
      use_if_cross_origin(URI.join(page_uri, href).to_s, page_uri)
    rescue URI::InvalidURIError
      nil
    end

    def use_if_cross_origin(icon_url, page_uri)
      icon_uri = URI.parse(icon_url)
      return nil unless icon_uri.host

      canonical_host(icon_uri) == canonical_host(page_uri) ? nil : icon_url
    rescue URI::InvalidURIError
      nil
    end

    def duckduckgo_icon(uri)
      actual = uri.host.to_s.downcase
      alternate = actual.start_with?("www.") ? actual.sub(/\Awww\./, "") : "www.#{actual}"
      candidates = [actual, alternate].uniq

      duckduckgo_uri = URI.parse(DUCKDUCKGO_FAVICON)
      http = Net::HTTP.new(duckduckgo_uri.host, duckduckgo_uri.port)
      http.use_ssl = true
      http.open_timeout = DUCKDUCKGO_CHECK_TIMEOUT
      http.read_timeout = DUCKDUCKGO_CHECK_TIMEOUT

      http.start do
        candidates.each do |h|
          path = "/ip3/#{URI.encode_www_form_component(h)}.ico"
          return "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(h)}.ico" if http.head(path).is_a?(Net::HTTPOK)
        end
      end

      duckduckgo_url_for(actual)
    rescue *NETWORK_ERRORS
      duckduckgo_url_for(actual)
    end

    def duckduckgo_url_for(host)
      "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(host)}.ico"
    end

    def best_by_size(candidates)
      candidates.max_by do |c|
        size = yield(c)
        size = 192 if size <= 0
        [icon_size_score(size), size]
      end
    end

    def icon_size_score(size)
      PREFERRED_ICON_SIZES.map { |p| -(size - p).abs }.max
    end

    def parse_sizes(sizes_str)
      sizes_str.split(/\s+/).filter_map do |part|
        next unless part =~ /\A(\d+)x(\d+)\z/i

        [Regexp.last_match(1).to_i, Regexp.last_match(2).to_i].max
      end
    end
  end
end
