import { useState, useEffect, useCallback } from "react"
import { getAnalytics } from "../../api/links"
import ClicksOverTimeChart from "../ClicksOverTimeChart"
import MetricCard from "./MetricCard"

function getTopCountry(byCountry) {
  if (!byCountry || Object.keys(byCountry).length === 0) return "N/A"
  return Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0][0]
}

function formatTimestamp(iso) {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })
  } catch {
    return "—"
  }
}

function clickGeolocation(v) {
  if (v?.geolocation?.trim()) return v.geolocation.trim()
  if (v?.country?.trim()) return v.country.trim()
  return "—"
}

function LoadingSkeleton() {
  return (
    <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm animate-pulse">
      Loading…
    </div>
  )
}

export default function LinkDetailView({ link, keyFromUrl, onBack }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchReport = useCallback(() => {
    const code = keyFromUrl || link?.key
    if (!code) return

    setLoading(true)
    setError(null)
    getAnalytics(code)
      .then((data) => {
        setReport(
          data && typeof data === "object"
            ? {
                by_country: data.by_country ?? data.byCountry ?? {},
                by_hour: data.by_hour ?? data.byHour ?? {},
                clicks: Array.isArray(data.clicks) ? data.clicks : [],
              }
            : {}
        )
      })
      .catch((err) => {
        setReport(null)
        setError(err?.errors?.[0] || "Failed to load analytics")
      })
      .finally(() => setLoading(false))
  }, [keyFromUrl, link?.key])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const topLocation = getTopCountry(report?.by_country)
  const clicks = link?.clicks_count ?? 0
  const clicksList = report?.clicks ?? []

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="text-gecko-slate hover:text-white text-sm font-medium flex items-center gap-1.5 min-h-[44px] touch-manipulation"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden /> Back to dashboard
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
            {link?.title ? `${link.title} — Stats` : `Stats for /${keyFromUrl}`}
          </h1>
          {link?.short_url && (
            <a
              href={link.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gecko-green text-sm sm:text-base font-medium mt-1 block truncate hover:text-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
              title={link.short_url}
            >
              {link.short_url}
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchReport}
            className="text-sm font-medium text-gecko-green hover:text-gecko-green-light ml-4 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Clicks" value={clicks} icon="fa-chart-line" />
        <MetricCard label="Top Location" value={topLocation} icon="fa-globe" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Clicks Over Time</h2>
          {loading ? <LoadingSkeleton /> : <ClicksOverTimeChart byHour={report?.by_hour} />}
        </div>
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Locations</h2>
          {loading ? (
            <LoadingSkeleton />
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
          Clicks, originating geolocation and timestamp of each click on this short URL.
        </p>
        {loading ? (
          <div className="py-8 text-center text-gecko-slate text-sm animate-pulse">Loading…</div>
        ) : clicksList.length === 0 ? (
          <div className="py-8 text-center text-gecko-slate text-sm">No clicks yet</div>
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
                {clicksList.map((v, i) => (
                  <tr key={i} className="border-b border-gecko-dark-border/50 last:border-0">
                    <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gecko-slate tabular-nums">{i + 1}</td>
                    <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white whitespace-nowrap">{formatTimestamp(v.clicked_at)}</td>
                    <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white">{clickGeolocation(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
