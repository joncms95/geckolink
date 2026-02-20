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

export default function AnalyticsDashboard({ shortCode }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!shortCode) return
    setLoading(true)
    setError(null)
    getAnalytics(shortCode)
      .then(setReport)
      .catch((e) => setError(e?.errors?.[0] || "Failed to load analytics"))
      .finally(() => setLoading(false))
  }, [shortCode])

  if (loading) {
    return (
      <div className="w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6 animate-pulse">
        <div className="h-6 bg-gecko-dark-border rounded w-1/3 mb-4" />
        <div className="h-4 bg-gecko-dark-border rounded w-full mb-2" />
        <div className="h-4 bg-gecko-dark-border rounded w-5/6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <section className="animate-fade-in w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6 shadow-card">
      <h2 className="text-lg font-semibold text-white mb-4">Analytics</h2>
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
    </section>
  )
}
