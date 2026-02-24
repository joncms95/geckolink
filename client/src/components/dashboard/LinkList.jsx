import ShortUrlCard from "./ShortUrlCard"
import Pagination from "./Pagination"
import { LINKS_PER_PAGE, SORT_OPTIONS } from "../../constants"

export default function LinkList({
  links,
  linksTotal,
  loading,
  currentPage,
  totalPages,
  sort,
  onSortChange,
  onPageChange,
  onViewStats,
  onCopy,
}) {
  const showPagination = linksTotal > LINKS_PER_PAGE && totalPages > 1
  const start = linksTotal > 0 ? (currentPage - 1) * LINKS_PER_PAGE + 1 : 0
  const end = linksTotal > 0 ? Math.min(currentPage * LINKS_PER_PAGE, linksTotal) : 0

  return (
    <section className="min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Short URLs
          {linksTotal > 0 && (
            <span className="ml-2 text-gecko-slate font-normal text-sm sm:text-base">
              Showing {start} to {end} of {linksTotal} results
            </span>
          )}
        </h2>
        {linksTotal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gecko-slate text-sm">Sort by</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              disabled={loading}
              aria-label="Sort links by"
              className="rounded-lg border border-gecko-dark-border bg-gecko-dark-card text-white text-sm px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark"
            >
              <option value={SORT_OPTIONS.NEWEST}>Newest first</option>
              <option value={SORT_OPTIONS.MOST_CLICKS}>Most clicks</option>
            </select>
          </div>
        )}
      </div>

      {loading && links.length === 0 ? (
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-8 text-center text-gecko-slate text-sm">
          Loading…
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-8 text-center text-gecko-slate text-sm">
          No short links yet. Create one on the home page or paste a short link above to view its stats.
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.key}>
                <ShortUrlCard link={link} onViewStats={onViewStats} onCopy={onCopy} />
              </li>
            ))}
          </ul>
          {showPagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              disabled={loading}
            />
          )}
        </>
      )}
    </section>
  )
}
