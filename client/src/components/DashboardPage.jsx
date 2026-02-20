import { useState, useEffect, useCallback, useRef } from "react"
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
  const { short_url: shortUrl, url, title, clicks_count: clicks } = link
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 flex items-center gap-4">
      <i className="fa-solid fa-link text-xl text-gecko-slate shrink-0" aria-hidden />
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
  onUpdateLink,
  lookupForm,
}) {
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const titleRefetchedRef = useRef(new Set())

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

  useEffect(() => {
    if (!selectedLink?.short_code) {
      setReport(null)
      return
    }
    setReportLoading(true)
    getAnalytics(selectedLink.short_code)
      .then((data) => {
        setReport(
          data && typeof data === "object"
            ? { by_country: data.by_country ?? data.byCountry ?? {}, by_hour: data.by_hour ?? data.byHour ?? {} }
            : {}
        )
      })
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false))
  }, [selectedLink?.short_code])

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (_) {}
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
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
                  onViewStats={onSelectLink}
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
