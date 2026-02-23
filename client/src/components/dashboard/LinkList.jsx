import ShortUrlCard from "./ShortUrlCard"
import { LINKS_PER_PAGE } from "../../constants"

// Build pagination items: [1, "...", 4, 5, 6, "...", 20] etc.
function paginationItems(currentPage, totalPages) {
  const delta = 1
  if (totalPages <= 0) return []
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const left = Math.max(2, currentPage - delta)
  const right = Math.min(totalPages - 1, currentPage + delta)
  const items = [1]

  if (left > 2) items.push("…")
  for (let p = left; p <= right; p++) {
    if (!items.includes(p)) items.push(p)
  }
  if (right < totalPages - 1) items.push("…")
  if (totalPages > 1) items.push(totalPages)

  return items
}

const btnClass =
  "min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
const btnActive = "bg-gecko-green text-gecko-dark"
const btnInactive =
  "bg-gecko-dark-card border border-gecko-dark-border text-white hover:border-gecko-green/50 hover:bg-gecko-dark-card/80"

export default function LinkList({
  links,
  linksTotal,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onViewStats,
  onCopy,
}) {
  const showPagination = linksTotal > LINKS_PER_PAGE && totalPages > 1
  const items = showPagination ? paginationItems(currentPage, totalPages) : []

  const start = linksTotal > 0 ? (currentPage - 1) * LINKS_PER_PAGE + 1 : 0
  const end = linksTotal > 0 ? Math.min(currentPage * LINKS_PER_PAGE, linksTotal) : 0

  return (
    <section className="min-w-0">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
        Short URLs
        {linksTotal > 0 && (
          <span className="ml-2 text-gecko-slate font-normal text-sm sm:text-base">
            Showing {start} to {end} of {linksTotal} results
          </span>
        )}
      </h2>

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
            <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={loading || currentPage <= 1}
                aria-label="Previous page"
                className={`${btnClass} ${btnInactive} px-3`}
              >
                Previous
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {items.map((item, i) =>
                  item === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gecko-slate" aria-hidden>
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item)}
                      disabled={loading}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={`Page ${item}`}
                      className={`${btnClass} ${item === currentPage ? btnActive : btnInactive}`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={loading || currentPage >= totalPages}
                aria-label="Next page"
                className={`${btnClass} ${btnInactive} px-3`}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
