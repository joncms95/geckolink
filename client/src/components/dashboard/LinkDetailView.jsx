import { useState, useEffect, useCallback, useMemo } from "react"
import { getAnalytics } from "../../api/links"
import { slicePage } from "../../utils/pagination"
import ClicksOverTimeChart from "../ClicksOverTimeChart"
import LinkIcon from "../ui/LinkIcon"
import MetricCard from "./MetricCard"
import MetricsGridLoading from "./MetricsGridLoading"
import Pagination from "./Pagination"
import { CLICKS_REPORT_PER_PAGE } from "../../constants"

function getTopCountry(byCountry) {
  if (!byCountry || Object.keys(byCountry).length === 0) return "N/A"
  return Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0][0]
}

function normalizeAnalyticsReport(data) {
  if (!data || typeof data !== "object") return null
  const byCountry = data.by_country ?? data.byCountry ?? {}
  const topFromApi = data.top_location ?? data.topLocation
  return {
    by_country: byCountry,
    by_hour: data.by_hour ?? data.byHour ?? {},
    clicks: Array.isArray(data.clicks) ? data.clicks : [],
    clicks_count: typeof data.clicks_count === "number" ? data.clicks_count : data.clicksCount,
    top_location: topFromApi != null && String(topFromApi).trim() !== "" ? String(topFromApi).trim() : getTopCountry(byCountry),
  }
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
  const [reportPage, setReportPage] = useState(1)

  const effectiveKey = keyFromUrl || link?.key

  const fetchReport = useCallback(() => {
    if (!effectiveKey) return

    setLoading(true)
    setError(null)
    getAnalytics(effectiveKey)
      .then((data) => {
        setReport(normalizeAnalyticsReport(data) ?? {})
      })
      .catch((err) => {
        setReport(null)
        setError(err?.errors?.[0] || "Failed to load analytics")
      })
      .finally(() => setLoading(false))
  }, [effectiveKey])

  useEffect(() => {
    if (!effectiveKey) return
    fetchReport()
  }, [fetchReport])

  const clicksList = report?.clicks ?? []
  const clicks = report?.clicks_count ?? link?.clicks_count ?? 0
  const topLocation = report?.top_location ?? "N/A"

  const { pageItems: paginatedClicks, start, totalPages: reportTotalPages, currentPage: reportCurrentPage } = useMemo(
    () => slicePage(clicksList, reportPage, CLICKS_REPORT_PER_PAGE),
    [clicksList, reportPage]
  )

  useEffect(() => {
    setReportPage(1)
  }, [effectiveKey])

  const heading = link?.title
    ? `${link.title} — Stats`
    : link?.target_url
      ? `Stats for ${link.target_url}`
      : `Stats for /${effectiveKey}`

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-gecko-slate hover:text-white text-sm font-medium flex items-center gap-1.5 min-h-[44px] touch-manipulation"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden /> Back to dashboard
        </button>
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 text-left sm:text-right sm:flex-row-reverse">
          <LinkIcon src={link?.icon_url} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
              {heading}
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
        {loading ? (
          <MetricsGridLoading colSpan={2} ariaLabel="Loading link stats" />
        ) : (
          <>
            <MetricCard label="Clicks" value={clicks} icon="fa-chart-line" />
            <MetricCard label="Top Location" value={topLocation} icon="fa-globe" />
          </>
        )}
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
          Clicks, geolocation, user agent and timestamp of each click on this short URL.
        </p>
        {loading ? (
          <div className="py-8 text-center text-gecko-slate text-sm animate-pulse">Loading…</div>
        ) : clicksList.length === 0 ? (
          <div className="py-8 text-center text-gecko-slate text-sm">No clicks yet</div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-gecko-dark-border">
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">#</th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">Timestamp</th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">Geolocation</th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClicks.map((v, i) => (
                    <tr key={(reportCurrentPage - 1) * CLICKS_REPORT_PER_PAGE + i} className="border-b border-gecko-dark-border/50 last:border-0">
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gecko-slate tabular-nums">{start + i}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white whitespace-nowrap">{formatTimestamp(v.clicked_at)}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white">{clickGeolocation(v)}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white max-w-[200px] sm:max-w-[280px] truncate" title={v.user_agent || undefined}>{v.user_agent || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={reportCurrentPage}
              totalPages={reportTotalPages}
              onPageChange={setReportPage}
              disabled={loading}
              totalItems={clicksList.length}
              perPage={CLICKS_REPORT_PER_PAGE}
            />
          </>
        )}
      </section>
    </>
  )
}
