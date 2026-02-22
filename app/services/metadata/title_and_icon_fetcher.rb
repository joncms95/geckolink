# frozen_string_literal: true

module Metadata
  # Fetches HTML from a URL and extracts title + icon URL. Used synchronously in the create flow.
  class TitleAndIconFetcher
    DEFAULT_TIMEOUT_SEC = 5
    MAX_BODY_SIZE = 256 * 1024
    MAX_MANIFEST_SIZE = 64 * 1024
    MAX_REDIRECTS = 5
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"

    def self.call(url, timeout_sec: DEFAULT_TIMEOUT_SEC)
      new(timeout_sec: timeout_sec).call(url)
    end

    def initialize(timeout_sec: DEFAULT_TIMEOUT_SEC)
      @timeout_sec = timeout_sec
    end

    # @return [Hash, nil] { title: String, icon_url: String } or nil on failure
    def call(url)
      result = fetch_body(url)
      return nil unless result

      body, page_uri = result
      title = extract_title(body)
      icon_url = resolve_icon_url(body, page_uri)

      out = {}
      out[:title] = title if title.present?
      out[:icon_url] = icon_url if icon_url.present?
      out.presence
    end

    private

    def fetch_body(url, redirect_count = 0)
      return nil if redirect_count > MAX_REDIRECTS

      uri = URI.parse(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = @timeout_sec
      http.read_timeout = @timeout_sec

      request = Net::HTTP::Get.new(uri.request_uri)
      request["User-Agent"] = USER_AGENT
      request["Accept"] = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
      request["Accept-Language"] = "en-US,en;q=0.9"

      response = http.request(request)

      case response
      when Net::HTTPOK
        return nil unless html_content?(response)

        body = response.body
        body = body.byteslice(0, MAX_BODY_SIZE) if body.bytesize > MAX_BODY_SIZE
        [ body.dup.force_encoding(Encoding::UTF_8), uri ]
      when Net::HTTPRedirection
        location = response["location"]
        return nil if location.blank?

        next_uri = URI.join(uri, location)
        fetch_body(next_uri.to_s, redirect_count + 1)
      else
        nil
      end
    rescue SocketError, OpenSSL::SSL::SSLError, Timeout::Error, URI::InvalidURIError, Errno::ECONNREFUSED
      nil
    end

    def html_content?(response)
      type = response["content-type"].to_s.split(";").first.to_s.strip.downcase
      type == "text/html" || type.end_with?("+html")
    end

    def extract_title(html)
      doc = Nokogiri::HTML(html)
      raw = doc.at_css("title")&.text
      title = raw&.strip&.slice(0, 500)
      return title if title.present?

      raw = doc.at_css('meta[property="og:title"]')&.[]("content")
      title = raw&.strip&.slice(0, 500)
      return title if title.present?

      raw = doc.at_css('meta[name="twitter:title"]')&.[]("content")
      raw&.strip&.slice(0, 500)
    end

    def resolve_icon_url(html, page_uri)
      base = page_uri.is_a?(URI) ? page_uri : URI.parse(page_uri.to_s)

      manifest_href = extract_manifest_href(html)
      if manifest_href.present?
        manifest_uri = URI.join(base, manifest_href)
        icon = icon_from_manifest(manifest_uri, base)
        return icon if icon.present?
      end

      favicon = extract_favicon_from_html(html, base)
      return favicon if favicon.present?

      URI.join(base, "/favicon.ico").to_s
    end

    def extract_manifest_href(html)
      doc = Nokogiri::HTML(html)
      node = doc.at_css('link[rel="manifest"]')
      node&.[]("href")&.strip&.presence
    end

    def icon_from_manifest(manifest_uri, base)
      body = fetch_json(manifest_uri)
      return nil unless body

      data = JSON.parse(body)
      icons = data["icons"]
      return nil unless icons.is_a?(Array) && icons.any?

      candidates = icons.select { |i| (i["purpose"].to_s.split.include?("any") || i["purpose"].to_s.blank?) && i["src"].present? }
      candidates = icons.select { |i| i["src"].present? } if candidates.empty?
      return nil if candidates.empty?

      best = candidates.max_by do |i|
        size = (i["sizes"].to_s.split.map { |s| s.to_i }.max) || 0
        size = 192 if size <= 0
        score = (size - 192).abs
        score = [ score, (size - 96).abs ].min
        -score
      end

      src = best["src"].to_s.strip
      return nil if src.blank?

      URI.join(manifest_uri, src).to_s
    rescue JSON::ParserError
      nil
    end

    def fetch_json(url)
      uri = url.is_a?(URI) ? url : URI.parse(url.to_s)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = @timeout_sec
      http.read_timeout = @timeout_sec

      request = Net::HTTP::Get.new(uri.request_uri)
      request["User-Agent"] = USER_AGENT
      request["Accept"] = "application/json, */*"

      response = http.request(request)
      return nil unless response.is_a?(Net::HTTPOK)

      body = response.body
      body = body.byteslice(0, MAX_MANIFEST_SIZE) if body.bytesize > MAX_MANIFEST_SIZE
      body.dup.force_encoding(Encoding::UTF_8)
    rescue SocketError, OpenSSL::SSL::SSLError, Timeout::Error, URI::InvalidURIError, Errno::ECONNREFUSED
      nil
    end

    def extract_favicon_from_html(html, base)
      doc = Nokogiri::HTML(html)
      node = doc.at_css('link[rel="icon"]') || doc.at_css('link[rel="shortcut icon"]') || doc.at_css('link[rel="apple-touch-icon"]')
      href = node&.[]("href")&.strip&.presence
      return nil if href.blank?

      URI.join(base, href).to_s
    end
  end
end
