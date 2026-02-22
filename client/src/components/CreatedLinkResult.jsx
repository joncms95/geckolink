import { useState } from "react"
import { BTN_PRIMARY, BTN_SECONDARY } from "../constants/classes"

export default function CreatedLinkResult({ createdLink, onCopyShortUrl, onViewDashboard }) {
  const [iconError, setIconError] = useState(false)
  const showIcon = createdLink?.icon_url && !iconError
  return (
    <div className="mt-6 sm:mt-8 max-w-2xl mx-auto rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-6 text-left shadow-gecko">
      <div className="flex gap-3 sm:gap-4 mb-4">
        {showIcon ? (
          <img
            src={createdLink.icon_url}
            alt=""
            className="w-10 h-10 rounded-lg shrink-0 object-cover bg-gecko-dark-border"
            referrerPolicy="no-referrer"
            onError={() => setIconError(true)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg shrink-0 bg-gecko-dark-border flex items-center justify-center"
            aria-hidden
          >
            <i className="fa-solid fa-link text-xl text-gecko-slate" aria-hidden />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-gecko-slate text-xs sm:text-sm font-medium mb-0.5">Target URL</p>
          <p className="text-white text-sm truncate" title={createdLink.url}>
            {createdLink.url}
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
          <button
            type="button"
            onClick={() => onCopyShortUrl(createdLink.short_url)}
            className={`w-full sm:w-auto ${BTN_PRIMARY}`}
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onViewDashboard}
            className={`w-full sm:w-auto ${BTN_SECONDARY}`}
          >
            View analytics
          </button>
        </div>
      </div>
    </div>
  )
}
