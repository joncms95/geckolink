import { useState, useCallback } from "react"

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gecko-green/20 text-gecko-green hover:bg-gecko-green/30 focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark-card transition-colors"
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <ClipboardIcon className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0a2 2 0 012 2v2m0 8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
    </svg>
  )
}

export default function ResultCard({ link, onReset }) {
  const { short_url: shortUrl, url, title, clicks_count: clicksCount } = link

  return (
    <article className="animate-slide-up w-full max-w-2xl rounded-2xl bg-gecko-dark-card border border-gecko-dark-border p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gecko-slate uppercase tracking-wider mb-1">Short link</p>
          <p className="text-gecko-green font-mono text-lg truncate" title={shortUrl}>
            {shortUrl}
          </p>
        </div>
        <CopyButton text={shortUrl} label="Copy short link" />
      </div>
      {title && (
        <p className="mt-4 text-white font-medium" title={title}>
          {title}
        </p>
      )}
      <p className="mt-1 text-sm text-gecko-slate truncate" title={url}>
        {url}
      </p>
      <p className="mt-4 text-sm text-gecko-slate">
        <span className="text-gecko-green font-semibold">{clicksCount}</span> clicks
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gecko-green hover:text-gecko-green-light focus:underline outline-none"
        >
          Open link →
        </a>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-gecko-slate hover:text-white focus:underline outline-none"
          >
            Shorten another
          </button>
        )}
      </div>
    </article>
  )
}
