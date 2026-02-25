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
    NETWORK_ERRORS = [
      SocketError, OpenSSL::SSL::SSLError, Timeout::Error,
      Net::OpenTimeout, Net::ReadTimeout,
      URI::InvalidURIError, Errno::ECONNREFUSED,
      Errno::ECONNRESET, Errno::EHOSTUNREACH,
      Errno::ETIMEDOUT, Errno::EPIPE, IOError
    ].freeze

    # @return [Result] always { title: String|nil, icon_url: String|nil }; failure only for invalid URL
    def self.call(url)
      uri = normalize_url(url)
      return Result.failure("Invalid URL") unless uri

      body, page_uri = fetch_html(uri)

      if body
        doc = Nokogiri::HTML(scrub_encoding(body))
        Result.success(title: extract_title(doc), icon_url: resolve_icon(doc, page_uri))
      else
        Result.success(title: nil, icon_url: duckduckgo_icon(uri))
      end
    end

    class << self
      private

      # --- URL helpers ---

      def normalize_url(url)
        s = url.to_s.strip
        return nil if s.blank?

        s = "https://#{s}" unless s.match?(%r{\Ahttps?://}i)
        uri = URI.parse(s)
        uri.host ? uri : nil
      rescue URI::InvalidURIError
        nil
      end

      def canonical_host(uri)
        uri.host.downcase.sub(/\Awww\./, "")
      end

      # --- HTTP ---

      def fetch_html(uri, redirects = 0)
        return nil if redirects > MAX_REDIRECTS

        response = http_get(uri, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")

        case response
        when Net::HTTPOK
          return nil unless html_content_type?(response)
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
        http.open_timeout = TIMEOUT
        http.read_timeout = TIMEOUT

        req = Net::HTTP::Get.new(uri.request_uri)
        req["User-Agent"] = USER_AGENT
        req["Accept"] = accept
        req["Accept-Language"] = "en-US,en;q=0.9"
        http.request(req)
      end

      def html_content_type?(response)
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

        best = pick_best_icon(usable) { |i| i["sizes"].to_s.split.map(&:to_i).max || 0 }
        src = best["src"].to_s.strip
        return nil if src.blank?

        cross_origin_only(URI.join(manifest_uri, src).to_s, page_uri)
      rescue JSON::ParserError, URI::InvalidURIError
        nil
      end

      def icon_from_html(doc, page_uri)
        nodes = doc.css("link[rel*='icon']").select { |n| n["href"].to_s.strip.present? }
        return nil if nodes.empty?

        best = pick_best_icon(nodes) { |n| parse_sizes(n["sizes"].to_s).max || 0 }
        href = best["href"].to_s.strip
        cross_origin_only(URI.join(page_uri, href).to_s, page_uri)
      rescue URI::InvalidURIError
        nil
      end

      # Returns the icon URL only if it's cross-origin (CDN etc.);
      # same-origin icons are unreliable in-app due to CORS/redirects.
      def cross_origin_only(icon_url, page_uri)
        icon_uri = URI.parse(icon_url)
        return nil unless icon_uri.host
        return nil if canonical_host(icon_uri) == canonical_host(page_uri)
        icon_url
      rescue URI::InvalidURIError
        nil
      end

      # --- DuckDuckGo favicon ---

      def duckduckgo_icon(uri)
        actual = uri.host.downcase
        alternate = actual.start_with?("www.") ? actual.sub(/\Awww\./, "") : "www.#{actual}"
        candidates = [actual, alternate].uniq

        duckduckgo_uri = URI.parse(DUCKDUCKGO_FAVICON)
        http = Net::HTTP.new(duckduckgo_uri.host, duckduckgo_uri.port)
        http.use_ssl = true
        http.open_timeout = DUCKDUCKGO_CHECK_TIMEOUT
        http.read_timeout = DUCKDUCKGO_CHECK_TIMEOUT

        http.start do
          candidates.each do |host|
            path = "/ip3/#{URI.encode_www_form_component(host)}.ico"
            return duckduckgo_url_for(host) if http.head(path).is_a?(Net::HTTPOK)
          end
        end

        duckduckgo_url_for(actual)
      rescue *NETWORK_ERRORS
        duckduckgo_url_for(actual)
      end

      def duckduckgo_url_for(host)
        "#{DUCKDUCKGO_FAVICON}/#{URI.encode_www_form_component(host)}.ico"
      end

      # --- Icon sizing ---

      def pick_best_icon(candidates)
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
end
