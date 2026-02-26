import { SCROLL_TARGETS } from "../../constants";
import InlineError from "../ui/InlineError";
import LookupForm from "./LookupForm";
import MetricCard from "./MetricCard";
import MetricsGridLoading from "./MetricsGridLoading";

export default function DashboardListView({ stats, onLookupResult }) {
  const { totalLinks, totalClicks, topLocation, loading, error } = stats;
  const avgClicks = totalLinks ? (totalClicks / totalLinks).toFixed(1) : "0.0";
  const topLocationDisplay =
    topLocation && topLocation.trim() !== "" ? topLocation : "N/A";

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
          <MetricsGridLoading colSpan={4} ariaLabel="Loading dashboard stats" />
        ) : error ? (
          <InlineError message={error} className="col-span-2 lg:col-span-4" />
        ) : (
          <>
            <MetricCard label="Total Links" value={totalLinks} icon="fa-link" />
            <MetricCard
              label="Total Clicks"
              value={totalClicks}
              icon="fa-chart-line"
            />
            <MetricCard
              label="Avg. Clicks/Link"
              value={avgClicks}
              icon="fa-chart-column"
            />
            <MetricCard
              label="Top Location"
              value={topLocationDisplay}
              icon="fa-globe"
            />
          </>
        )}
      </div>
      <LookupForm onResult={onLookupResult} />
    </>
  );
}
