import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import { getAnalytics, getLink } from "../api/links"
import ClicksOverTimeChart from "./ClicksOverTimeChart"

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-5">
      <div className="flex items-start justify-end">
        <i className={`fa-solid ${icon} text-xl text-gecko-green`} aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-gecko-slate">{label}</p>
    </div>
  )
}

function ShortUrlCard({ link, onViewStats, onCopy }) {
  const { short_url: shortUrl, url, title, icon_url: iconUrl, clicks_count: clicks } = link
  const [iconError, setIconError] = useState(false)
  const showIcon = iconUrl && !iconError
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 flex items-center gap-4">
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
        <p className="text-gecko-green font-medium truncate">{shortUrl}</p>
        {title && (
          <p className="text-white text-sm truncate mt-0.5" title={title}>
            {title}
          </p>
        )}
        <p className="text-gecko-slate text-sm truncate mt-0.5">{url}</p>
        <p className="text-gecko-slate text-xs mt-1">{clicks} clicks</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onViewStats(link)}
          className="text-sm font-medium text-gecko-green hover:text-gecko-green-light focus:underline outline-none"
        >
          View Stats →
        </button>
        <button
          type="button"
          onClick={() => onCopy(shortUrl)}
          aria-label="Copy short link"
          className="p-2 rounded-lg text-gecko-slate hover:text-white hover:bg-gecko-dark-border transition-colors"
        >
          <i className="fa-solid fa-copy text-xl" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage({
  recentLinks,
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
  const titleRefetchedRef = useRef(new Set())

  // When URL has :shortCode, load that link and set as selected so stats persist on refresh
  useEffect(() => {
    if (!shortCodeFromUrl) return
    getLink(shortCodeFromUrl)
      .then((link) => {
        onSelectLink(link)
        if (onAddToRecent) onAddToRecent(link)
      })
      .catch(() => {})
  }, [shortCodeFromUrl])

  useEffect(() => {
    if (!onUpdateLink) return
    const withoutTitle = recentLinks.filter((l) => !(l.title && l.title.trim()))
    const timeouts = []
    withoutTitle.forEach((link) => {
      if (titleRefetchedRef.current.has(link.short_code)) return
      titleRefetchedRef.current.add(link.short_code)
      const id = setTimeout(() => {
        getLink(link.short_code)
          .then((data) => onUpdateLink(link.short_code, data))
          .catch(() => {
            titleRefetchedRef.current.delete(link.short_code)
          })
      }, 2000)
      timeouts.push(id)
    })
    return () => timeouts.forEach(clearTimeout)
  }, [recentLinks, onUpdateLink])

  const totalLinks = recentLinks.length
  const totalClicks = recentLinks.reduce((s, l) => s + (l.clicks_count || 0), 0)
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {isDetailView ? (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            {onNavigateToStats && (
              <button
                type="button"
                onClick={() => onNavigateToStats("/dashboard")}
                className="text-gecko-slate hover:text-white text-sm font-medium flex items-center gap-1"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden /> Back to dashboard
              </button>
            )}
            <h1 className="text-2xl font-bold text-white">
              {selectedLink?.title ? `${selectedLink.title} — Stats` : `Stats for /${shortCodeFromUrl}`}
            </h1>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Clicks" value={detailClicks} icon="fa-chart-line" />
            <MetricCard label="Top Location" value={detailTopLocation} icon="fa-globe" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Clicks Over Time</h2>
              {reportLoading ? (
                <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm">Loading…</div>
              ) : (
                <ClicksOverTimeChart byHour={report?.by_hour} />
              )}
            </div>
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Top Locations</h2>
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

          <section className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Usage report</h2>
            <p className="text-gecko-slate text-sm mb-4">
              Clicks, originating geolocation and timestamp of each visit to this short URL.
            </p>
            {reportLoading ? (
              <div className="py-8 text-center text-gecko-slate text-sm">Loading…</div>
            ) : visits.length === 0 ? (
              <div className="py-8 text-center text-gecko-slate text-sm">No visits yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gecko-dark-border">
                      <th className="text-left py-3 px-3 text-gecko-slate font-medium">#</th>
                      <th className="text-left py-3 px-3 text-gecko-slate font-medium">Timestamp</th>
                      <th className="text-left py-3 px-3 text-gecko-slate font-medium">Geolocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={i} className="border-b border-gecko-dark-border/50 last:border-0">
                        <td className="py-2.5 px-3 text-gecko-slate tabular-nums">{i + 1}</td>
                        <td className="py-2.5 px-3 text-white">{formatTimestamp(v.visited_at)}</td>
                        <td className="py-2.5 px-3 text-white">{visitGeolocation(v)}</td>
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
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Links" value={totalLinks} icon="fa-link" />
            <MetricCard label="Total Clicks" value={totalClicks} icon="fa-chart-line" />
            <MetricCard label="Avg. Clicks/Link" value={avgClicks} icon="fa-chart-column" />
            <MetricCard label="Top Location" value={topLocation} icon="fa-globe" />
          </div>

          {lookupForm && (
            <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4">
              <p className="text-sm text-gecko-slate mb-3">Already have a short link? Paste it below to load its analytics.</p>
              {lookupForm}
            </div>
          )}

          <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-6">
            <p className="text-gecko-slate text-sm">
              Click <strong className="text-white">View Stats →</strong> on a short link below to see detailed analytics, including clicks over time, top locations, and a usage report (timestamp and geolocation per visit).
            </p>
          </div>
        </>
      )}

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">All Short URLs</h2>
        {recentLinks.length === 0 ? (
          <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-8 text-center text-gecko-slate text-sm">
            No short links yet. Create one on the home page or paste a short link above to view its stats.
          </div>
        ) : (
          <ul className="space-y-3">
            {recentLinks.map((link) => (
              <li key={link.short_code}>
                <ShortUrlCard
                  link={link}
                  onViewStats={onNavigateToStats ? (l) => onNavigateToStats(`/dashboard/${l.short_code}`) : onSelectLink}
                  onCopy={handleCopy}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
