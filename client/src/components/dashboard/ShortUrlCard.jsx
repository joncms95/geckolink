import LinkIcon from "../ui/LinkIcon";

export default function ShortUrlCard({ link, onViewStats, onCopy }) {
  const {
    short_url: shortUrl,
    target_url: targetUrl,
    title,
    icon_url: iconUrl,
    clicks_count: clicks,
  } = link;

  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <LinkIcon src={iconUrl} />
        <div className="flex-1 min-w-0">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gecko-green font-medium text-sm sm:text-base truncate break-all sm:break-normal block hover:text-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
            title={shortUrl}
          >
            {shortUrl}
          </a>
          <p
            className={`text-sm truncate mt-0.5 ${title ? "text-white" : "text-gecko-slate"}`}
            title={title || undefined}
          >
            {title || "—"}
          </p>
          <p
            className="text-gecko-slate text-xs sm:text-sm truncate mt-0.5"
            title={targetUrl}
          >
            {targetUrl}
          </p>
          <p className="text-gecko-slate text-xs mt-1">{clicks} clicks</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onViewStats(link)}
          className="text-sm font-medium text-gecko-green hover:text-gecko-green-light focus:underline outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded min-h-[44px] px-2 touch-manipulation"
        >
          View Stats →
        </button>
        <button
          type="button"
          onClick={() => onCopy(shortUrl)}
          aria-label="Copy short link"
          className="p-2.5 rounded-lg text-gecko-slate hover:text-white hover:bg-gecko-dark-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <i className="fa-solid fa-copy text-lg sm:text-xl" aria-hidden />
        </button>
      </div>
    </div>
  );
}
