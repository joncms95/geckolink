import Button from "../ui/Button"
import ShortUrlCard from "./ShortUrlCard"

export default function LinkList({
  links,
  linksTotal,
  loading,
  hasMore,
  onLoadMore,
  onViewStats,
  onCopy,
}) {
  return (
    <section className="min-w-0">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
        Short URLs
        {linksTotal > 0 && (
          <span className="ml-2 text-gecko-slate font-normal text-sm sm:text-base">
            {links.length} of {linksTotal}
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
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={onLoadMore} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
