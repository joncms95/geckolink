import { paginationItems } from "../../utils/pagination"

const btnClass =
  "min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
const btnActive = "bg-gecko-green text-gecko-dark"
const btnInactive =
  "bg-gecko-dark-card border border-gecko-dark-border text-white hover:border-gecko-green/50 hover:bg-gecko-dark-card/80"

/**
 * Reusable pagination: Previous / page numbers / Next, with optional "Showing X to Y of Z".
 * @param {number} currentPage - 1-based
 * @param {number} totalPages
 * @param {function(number): void} onPageChange - called with the new page (1-based)
 * @param {boolean} [disabled] - disables buttons (e.g. while loading)
 * @param {number} [totalItems] - total item count for summary
 * @param {number} [perPage] - items per page for summary (required if totalItems is set)
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  totalItems,
  perPage,
}) {
  const showPagination = totalPages > 1
  const items = showPagination ? paginationItems(currentPage, totalPages) : []

  const start = totalItems != null && perPage != null && totalItems > 0
    ? (currentPage - 1) * perPage + 1
    : null
  const end = totalItems != null && perPage != null && totalItems > 0
    ? Math.min(currentPage * perPage, totalItems)
    : null

  if (!showPagination && start == null) return null

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      {start != null && end != null && totalItems != null && (
        <p className="text-gecko-slate text-sm">
          Showing {start} to {end} of {totalItems} results
        </p>
      )}
      {showPagination && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage <= 1}
            aria-label="Previous page"
            className={`${btnClass} ${btnInactive} px-3`}
          >
            <i className="fa-solid fa-chevron-left" />
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
                  disabled={disabled}
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
            disabled={disabled || currentPage >= totalPages}
            aria-label="Next page"
            className={`${btnClass} ${btnInactive} px-3`}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </nav>
      )}
    </div>
  )
}
