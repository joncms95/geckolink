import { useState, useEffect } from "react"
import { getAnalytics } from "../api/links"

function formatHour(isoString) {
  try {
    const d = new Date(isoString)
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
  } catch {
    return isoString
  }
}

function CountryList({ byCountry }) {
  const entries = Object.entries(byCountry || {}).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return <p className="text-gecko-slate text-sm">No country data yet.</p>
  return (
    <ul className="space-y-2">
      {entries.map(([country, count]) => (
        <li key={country} className="flex items-center justify-between py-2 border-b border-gecko-dark-border last:border-0">
          <span className="text-white">{country}</span>
          <span className="font-semibold text-gecko-green tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  )
}

function HourChart({ byHour }) {
  const entries = Object.entries(byHour || {})
    .map(([k, v]) => [k, v])
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-24)
  const max = Math.max(1, ...entries.map(([, v]) => v))
  if (entries.length === 0) return <p className="text-gecko-slate text-sm">No hourly data yet.</p>
  return (
    <ul className="space-y-2">
      {entries.map(([hour, count]) => (
        <li key={hour} className="flex items-center gap-3">
          <span className="text-gecko-slate text-sm w-36 shrink-0">{formatHour(hour)}</span>
          <span className="flex-1 h-6 bg-gecko-dark-border rounded overflow-hidden" role="presentation">
            <span
              className="block h-full bg-gecko-green rounded transition-all duration-300"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </span>
          <span className="font-semibold text-gecko-green w-8 text-right tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-gecko-dark-border/50 border border-gecko-dark-border p-6 text-center">
      <p className="text-gecko-slate text-sm mb-1">No traffic yet</p>
      <p className="text-gecko-slate/80 text-xs">Clicks will appear here after someone uses your short link.</p>
    </div>
  )
}

function getErrorMessage(e) {
  if (e?.name === "AbortError") return "Request timed out. Check your connection and try again."
  const msg = e?.errors?.[0] ?? e?.message
  if (msg) return msg
  return "Couldn't load analytics. You can still use your short link."
}

export default function AnalyticsDashboard({ shortCode, totalClicks }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getAnalytics(shortCode)
      .then((data) => {
        setReport(
          data && typeof data === "object"
            ? {
                by_country: data.by_country ?? data.byCountry ?? {},
                by_hour: data.by_hour ?? data.byHour ?? {},
              }
            : {}
        )
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [shortCode, retryKey])

  if (loading) {
    return (
      <section className="w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Analytics</h2>
          {typeof totalClicks === "number" && (
            <span className="text-gecko-slate text-sm">
              <span className="font-semibold text-gecko-green tabular-nums">{totalClicks}</span> total clicks
            </span>
          )}
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gecko-dark-border rounded w-full" />
          <div className="h-4 bg-gecko-dark-border rounded w-5/6" />
          <div className="h-4 bg-gecko-dark-border rounded w-4/6" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Analytics</h2>
            {typeof totalClicks === "number" && (
              <p className="text-gecko-slate text-sm mb-2">
                <span className="font-semibold text-gecko-green tabular-nums">{totalClicks}</span> total clicks
              </p>
            )}
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="text-sm font-medium text-gecko-green hover:text-gecko-green-light focus:underline outline-none"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    )
  }

  const hasCountry = report?.by_country && Object.keys(report.by_country).length > 0
  const hasHour = report?.by_hour && Object.keys(report.by_hour).length > 0
  const hasAnyData = hasCountry || hasHour

  return (
    <section className="animate-fade-in w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-white">Analytics</h2>
        {typeof totalClicks === "number" && (
          <span className="text-gecko-slate text-sm">
            <span className="font-semibold text-gecko-green tabular-nums">{totalClicks}</span> total clicks
          </span>
        )}
      </div>
      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gecko-slate uppercase tracking-wider mb-3">By country</h3>
            <CountryList byCountry={report?.by_country} />
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-sm font-medium text-gecko-slate uppercase tracking-wider mb-3">Clicks by hour</h3>
            <div className="max-h-64 overflow-y-auto pr-2">
              <HourChart byHour={report?.by_hour} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
