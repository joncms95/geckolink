import { useCallback, useEffect, useMemo, useState } from "react";
import { formatApiError } from "../../api/errors";
import { getAnalytics } from "../../api/links";
import { CLICKS_REPORT_PER_PAGE, SCROLL_TARGETS } from "../../constants";
import { slicePage } from "../../utils/pagination";
import {
  clickGeolocation,
  formatTimestamp,
  normalizeAnalyticsReport,
} from "../../utils/analytics";
import { scrollToTop } from "../../utils/scroll";
import ClicksOverTimeChart from "../ClicksOverTimeChart";
import InlineError from "../ui/InlineError";
import LinkIcon from "../ui/LinkIcon";
import LoadingSkeleton from "../ui/LoadingSkeleton";
import MetricCard from "./MetricCard";
import MetricsGridLoading from "./MetricsGridLoading";
import Pagination from "./Pagination";

export default function LinkDetailView({ link, keyFromUrl, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportPage, setReportPage] = useState(1);

  const effectiveKey = keyFromUrl || link?.key;

  const fetchReport = useCallback(() => {
    if (!effectiveKey) return;

    setLoading(true);
    setError(null);
    getAnalytics(effectiveKey)
      .then((data) => {
        setReport(normalizeAnalyticsReport(data) ?? {});
      })
      .catch((err) => {
        setReport(null);
        setError(formatApiError(err));
      })
      .finally(() => setLoading(false));
  }, [effectiveKey]);

  useEffect(() => {
    if (!effectiveKey) return;
    setReportPage(1);
    fetchReport();
  }, [fetchReport]);

  const clicksList = report?.clicks ?? [];
  const clicks = report?.clicks_count ?? link?.clicks_count ?? 0;
  const topLocation = report?.top_location ?? "N/A";

  const {
    pageItems: paginatedClicks,
    start,
    totalPages: reportTotalPages,
    currentPage: reportCurrentPage,
  } = useMemo(
    () => slicePage(clicksList, reportPage, CLICKS_REPORT_PER_PAGE),
    [clicksList, reportPage],
  );

  const heading = link?.title
    ? `${link.title} — Stats`
    : link?.target_url
      ? `Stats for ${link.target_url}`
      : `Stats for /${effectiveKey}`;

  const handleReportPageChange = useCallback((page) => {
    setReportPage(page);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToTop(SCROLL_TARGETS.USAGE_REPORT));
    });
  }, []);

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

      {error && <InlineError message={error} onRetry={fetchReport} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <MetricsGridLoading colSpan={2} ariaLabel="Loading link stats" />
        ) : (
          <>
            <MetricCard label="Clicks" value={clicks} icon="fa-chart-line" />
            <MetricCard
              label="Top Location"
              value={topLocation}
              icon="fa-globe"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Clicks Over Time
          </h2>
          {loading ? (
            <LoadingSkeleton className="h-[180px]" />
          ) : (
            <ClicksOverTimeChart byHour={report?.by_hour} />
          )}
        </div>
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Top Locations
          </h2>
          {loading ? (
            <LoadingSkeleton className="h-[180px]" />
          ) : report?.by_country &&
            Object.keys(report.by_country).length > 0 ? (
            <ul className="space-y-2 max-h-[180px] overflow-y-auto">
              {Object.entries(report.by_country)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([country, count]) => (
                  <li
                    key={country}
                    className="flex justify-between py-1.5 border-b border-gecko-dark-border last:border-0"
                  >
                    <span className="text-white">{country}</span>
                    <span className="text-gecko-green font-semibold tabular-nums">
                      {count}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gecko-slate text-sm">
              No location data yet
            </div>
          )}
        </div>
      </div>

      <section
        className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 overflow-hidden"
        data-scroll-target={SCROLL_TARGETS.USAGE_REPORT}
      >
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Usage report
        </h2>
        <p className="text-gecko-slate text-xs sm:text-sm mb-4">
          Clicks, geolocation, user agent and timestamp of each click on this
          short URL.
        </p>
        {loading ? (
          <LoadingSkeleton className="py-8" />
        ) : clicksList.length === 0 ? (
          <div className="py-8 text-center text-gecko-slate text-sm">
            No clicks yet
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-gecko-dark-border">
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">
                      #
                    </th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">
                      Timestamp
                    </th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">
                      Geolocation
                    </th>
                    <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-gecko-slate font-medium">
                      User Agent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClicks.map((v, i) => (
                    <tr
                      key={(reportCurrentPage - 1) * CLICKS_REPORT_PER_PAGE + i}
                      className="border-b border-gecko-dark-border/50 last:border-0"
                    >
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gecko-slate tabular-nums">
                        {start + i}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white whitespace-nowrap">
                        {formatTimestamp(v.clicked_at)}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-white">
                        {clickGeolocation(v)}
                      </td>
                      <td
                        className="py-2 sm:py-2.5 px-2 sm:px-3 text-white max-w-[200px] sm:max-w-[280px] truncate"
                        title={v.user_agent || undefined}
                      >
                        {v.user_agent || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={reportCurrentPage}
              totalPages={reportTotalPages}
              onPageChange={handleReportPageChange}
              disabled={loading}
              totalItems={clicksList.length}
              perPage={CLICKS_REPORT_PER_PAGE}
            />
          </>
        )}
      </section>
    </>
  );
}
