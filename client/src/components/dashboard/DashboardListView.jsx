import MetricCard from "./MetricCard"
import LookupForm from "./LookupForm"
import { SCROLL_TARGETS } from "../../constants"

export default function DashboardListView({ stats, onLookupResult }) {
  const { totalLinks, totalClicks, topLocation, loading, error } = stats
  const avgClicks = totalLinks ? (totalClicks / totalLinks).toFixed(1) : "0.0"
  const topLocationDisplay = topLocation && topLocation.trim() !== "" ? topLocation : "N/A"

  return (
    <>
      <h1
        className="text-xl sm:text-2xl font-bold text-white"
        data-scroll-target={SCROLL_TARGETS.DASHBOARD}
      >
        Analytics Dashboard
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-2 lg:col-span-4 flex items-center justify-center py-8">
            <span className="text-gecko-slate" aria-label="Loading dashboard stats">
              <i className="fa-solid fa-spinner fa-spin text-2xl" aria-hidden />
            </span>
          </div>
        ) : error ? (
          <div className="col-span-2 lg:col-span-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            <MetricCard label="Total Links" value={totalLinks} icon="fa-link" />
            <MetricCard label="Total Clicks" value={totalClicks} icon="fa-chart-line" />
            <MetricCard label="Avg. Clicks/Link" value={avgClicks} icon="fa-chart-column" />
            <MetricCard label="Top Location" value={topLocationDisplay} icon="fa-globe" />
          </>
        )}
      </div>
      <LookupForm onResult={onLookupResult} />
    </>
  )
}
