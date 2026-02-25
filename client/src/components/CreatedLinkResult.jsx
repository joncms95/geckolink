import Button from "./ui/Button"
import LinkIcon from "./ui/LinkIcon"

export default function CreatedLinkResult({ createdLink, onCopyShortUrl, onViewDashboard }) {
  return (
    <div className="mt-6 sm:mt-8 max-w-2xl mx-auto rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 text-left shadow-gecko">
      <div className="flex gap-3 sm:gap-4 mb-4">
        <LinkIcon src={createdLink.icon_url} />
        <div className="flex-1 min-w-0">
          <p className="text-gecko-slate text-xs sm:text-sm font-medium mb-0.5">Target URL</p>
          <p className="text-white text-sm truncate" title={createdLink.target_url}>
            {createdLink.target_url}
          </p>
        </div>
      </div>
      <p className="text-gecko-slate text-xs sm:text-sm font-medium mb-1">Title</p>
      <p className="text-white text-sm truncate mb-4" title={createdLink.title || ""}>
        {createdLink.title?.trim() || "—"}
      </p>
      <p className="text-gecko-slate text-xs sm:text-sm font-medium mb-2">Short URL</p>
      <div className="flex flex-col gap-3">
        <a
          href={createdLink.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gecko-green font-medium text-sm break-all hover:text-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
          title={createdLink.short_url}
        >
          {createdLink.short_url}
        </a>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={() => onCopyShortUrl(createdLink.short_url)} className="w-full sm:w-auto">
            Copy
          </Button>
          {onViewDashboard && (
            <Button variant="secondary" onClick={onViewDashboard} className="w-full sm:w-auto">
              View analytics
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
