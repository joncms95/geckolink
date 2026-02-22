import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { getAnalytics, getLink } from "../api/links"
import ClicksOverTimeChart from "./ClicksOverTimeChart"

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-end">
        <i className={`fa-solid ${icon} text-lg sm:text-xl text-gecko-green`} aria-hidden />
      </div>
      <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-white tabular-nums truncate" title={String(value)}>{value}</p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gecko-slate">{label}</p>
    </div>
  )
}

function ShortUrlCard({ link, onViewStats, onCopy }) {
  const { short_url: shortUrl, url, title, icon_url: iconUrl, clicks_count: clicks } = link
  const [iconError, setIconError] = useState(false)
  const showIcon = iconUrl && !iconError
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {showIcon ? (
          <img
            src={iconUrl}
            alt=""
            className="w-10 h-10 rounded-lg shrink-0 object-cover bg-gecko-dark-border"
            referrerPolicy="no-referrer"
            onError={() => setIconError(true)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg shrink-0 bg-gecko-dark-border flex items-center justify-center"
            aria-hidden
          >
            <i className="fa-solid fa-link text-xl text-gecko-slate" aria-hidden />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gecko-green font-medium text-sm sm:text-base truncate break-all sm:break-normal block hover:text-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
            title={shortUrl}
          >
            {shortUrl}
          </a>
          {title && (
            <p className="text-white text-sm truncate mt-0.5" title={title}>
              {title}
            </p>
          )}
          <p className="text-gecko-slate text-xs sm:text-sm truncate mt-0.5" title={url}>{url}</p>
          <p className="text-gecko-slate text-xs mt-1">{clicks} clicks</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onViewStats(link)}
          className="text-sm font-medium text-gecko-green hover:text-gecko-green-light focus:underline outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded min-h-[44px] px-2 touch-manipulation"
        >
          View Stats →
        </button>
        <button
          type="button"
          onClick={() => onCopy(shortUrl)}
          aria-label="Copy short link"
          className="p-2.5 rounded-lg text-gecko-slate hover:text-white hover:bg-gecko-dark-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <i className="fa-solid fa-copy text-lg sm:text-xl" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage({
  displayedLinks,
  displayedLinksLoading,
  totalRecentCount,
  hasMoreLinks,
  onLoadMore,
  selectedLink,
  onSelectLink,
  onAddToRecent,
  onUpdateLink,
  onNavigateToStats,
  lookupForm,
}) {
  const { shortCode: shortCodeFromUrl } = useParams()
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    if (shortCodeFromUrl) window.scrollTo(0, 0)
  }, [shortCodeFromUrl])

  useEffect(() => {
    if (!shortCodeFromUrl) return
    const inList = displayedLinks.find((l) => l.short_code === shortCodeFromUrl)
    if (inList) {
      onSelectLink(inList)
      return
    }
    getLink(shortCodeFromUrl)
      .then((link) => {
        onSelectLink(link)
        if (onAddToRecent) onAddToRecent(link)
      })
      .catch(() => {})
  }, [shortCodeFromUrl, displayedLinks])

  const totalLinks = displayedLinks.length
  const totalClicks = displayedLinks.reduce((s, l) => s + (l.clicks_count || 0), 0)
  const avgClicks = totalLinks ? (totalClicks / totalLinks).toFixed(1) : "0.0"
  const topLocation = report?.by_country && Object.keys(report.by_country).length > 0
    ? Object.entries(report.by_country).sort((a, b) => b[1] - a[1])[0][0]
    : "N/A"

  const statsShortCode = shortCodeFromUrl || selectedLink?.short_code

  useEffect(() => {
    if (!statsShortCode) {
      setReport(null)
      return
    }
    setReportLoading(true)
    getAnalytics(statsShortCode)
      .then((data) => {
        setReport(
          data && typeof data === "object"
            ? {
                by_country: data.by_country ?? data.byCountry ?? {},
                by_hour: data.by_hour ?? data.byHour ?? {},
                visits: Array.isArray(data.visits) ? data.visits : [],
              }
            : {}
        )
      })
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false))
  }, [statsShortCode])

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (_) {}
  }, [])

  const isDetailView = Boolean(shortCodeFromUrl)
  const detailTopLocation = report?.by_country && Object.keys(report.by_country).length > 0
    ? Object.entries(report.by_country).sort((a, b) => b[1] - a[1])[0][0]
    : "N/A"
  const detailClicks = selectedLink?.clicks_count ?? 0
  const visits = report?.visits ?? []

  function formatTimestamp(iso) {
    if (!iso) return "—"
    try {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })
    } catch {
      return "—"
    }
  }

  function visitGeolocation(v) {
    if (v?.geolocation?.trim()) return v.geolocation.trim()
    if (v?.country?.trim()) return v.country.trim()
    return "—"
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {isDetailView ? (
        <>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {onNavigateToStats && (
              <button
                type="button"
                onClick={() => onNavigateToStats("/dashboard")}
                className="text-gecko-slate hover:text-white text-sm font-medium flex items-center gap-1.5 min-h-[44px] touch-manipulation"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden /> Back to dashboard
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
                {selectedLink?.title ? `${selectedLink.title} — Stats` : `Stats for /${shortCodeFromUrl}`}
              </h1>
              {selectedLink?.short_url && (
                <a
                  href={selectedLink.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gecko-green text-sm sm:text-base font-medium mt-1 block truncate hover:text-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
                  title={selectedLink.short_url}
                >
                  {selectedLink.short_url}
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard label="Clicks" value={detailClicks} icon="fa-chart-line" />
            <MetricCard label="Top Location" value={detailTopLocation} icon="fa-globe" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Clicks Over Time</h2>
              {reportLoading ? (
                <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm">Loading…</div>
              ) : (
                <ClicksOverTimeChart byHour={report?.by_hour} />
              )}
            </div>
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Locations</h2>
              {reportLoading ? (
                <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm">Loading…</div>
              ) : report?.by_country && Object.keys(report.by_country).length > 0 ? (
                <ul className="space-y-2 max-h-[180px] overflow-y-auto">
                  {Object.entries(report.by_country)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <li key={country} className="flex justify-between py-1.5 border-b border-gecko-dark-border last:border-0">
                        <span className="text-white">{country}</span>
                        <span className="text-gecko-green font-semibold tabular-nums">{count}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm">No location data yet</div>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Usage report</h2>
            <p className="text-gecko-slate text-xs sm:text-sm mb-4">
              Clicks, originating geolocation and timestamp of each visit to this short URL.
            </p>
            {reportLoading ? (
              <div className="py-8 text-center text-gecko-slate text-sm">Loading…</div>
            ) : visits.length === 0 ? (
              <div className="py-8 text-center text-gecko-slate text-sm">No visits yet</div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[320px]">
                  <thead>
                    <tr className="border-b border-gecko-dark-border">
                      <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">#</th>
                      <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">Timestamp</th>
                      <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">Geolocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={i} className="border-b border-gecko-dark-border/50 last:border-0">
                        <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gecko-slate tabular-nums">{i + 1}</td>
                        <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white whitespace-nowrap">{formatTimestamp(v.visited_at)}</td>
                        <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white">{visitGeolocation(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard label="Total Links" value={totalLinks} icon="fa-link" />
            <MetricCard label="Total Clicks" value={totalClicks} icon="fa-chart-line" />
            <MetricCard label="Avg. Clicks/Link" value={avgClicks} icon="fa-chart-column" />
            <MetricCard label="Top Location" value={topLocation} icon="fa-globe" />
          </div>

          {lookupForm && (
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4">
              <p className="text-xs sm:text-sm text-gecko-slate mb-3">Already have a short link? Paste it below to load its analytics.</p>
              {lookupForm}
            </div>
          )}

          <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6">
            <p className="text-gecko-slate text-xs sm:text-sm">
              Click <strong className="text-white">View Stats →</strong> on a short link below to see detailed analytics, including clicks over time, top locations, and a usage report (timestamp and geolocation per visit).
            </p>
          </div>
        </>
      )}

      <section className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
          Short URLs
          {totalRecentCount > 0 && (
            <span className="ml-2 text-gecko-slate font-normal text-sm sm:text-base">
              {displayedLinks.length} of {totalRecentCount}
            </span>
          )}
        </h2>
        {displayedLinksLoading && displayedLinks.length === 0 ? (
          <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-8 text-center text-gecko-slate text-sm">
            Loading…
          </div>
        ) : displayedLinks.length === 0 ? (
          <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-8 text-center text-gecko-slate text-sm">
            No short links yet. Create one on the home page or paste a short link above to view its stats.
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {displayedLinks.map((link) => (
                <li key={link.short_code}>
                  <ShortUrlCard
                    link={link}
                    onViewStats={onNavigateToStats ? (l) => onNavigateToStats(`/dashboard/${l.short_code}`) : onSelectLink}
                    onCopy={handleCopy}
                  />
                </li>
              ))}
            </ul>
            {hasMoreLinks && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={displayedLinksLoading}
                  className="px-5 py-3 rounded-xl font-medium border border-gecko-dark-border text-gecko-slate hover:text-white hover:bg-gecko-dark-border focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark disabled:opacity-60 min-h-[44px] touch-manipulation"
                >
                  {displayedLinksLoading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
