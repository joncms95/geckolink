import { useState, useCallback } from "react"
import { normalizeUrl, hasValidHost } from "../utils/url"

const INPUT_PLACEHOLDER = "Paste your long URL here"

export default function UrlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  const normalized = normalizeUrl(url)
  const isValid = /^https?:\/\/\S+$/i.test(normalized) && hasValidHost(normalized)
  const showError = touched && (error || (url.trim() && !isValid))

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      setTouched(true)
      setError(null)
      const trimmed = url.trim()
      if (!trimmed) {
        setError("Please enter a URL")
        return
      }
      const toSubmit = normalizeUrl(trimmed)
      if (!/^https?:\/\/\S+$/i.test(toSubmit)) {
        setError("Please enter a valid URL")
        return
      }
      if (!hasValidHost(toSubmit)) {
        setError("URL must have a valid domain (e.g. example.com)")
        return
      }
      onSubmit(toSubmit)
    },
    [url, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="sr-only" htmlFor="url-input">
            Long URL to shorten
          </label>
          <input
          id="url-input"
          type="text"
          inputMode="url"
          autoCorrect="off"
          spellCheck="false"
          autoComplete="url"
          placeholder={INPUT_PLACEHOLDER}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          onBlur={() => setTouched(true)}
          disabled={isLoading}
          aria-invalid={showError}
          aria-describedby={showError ? "url-error" : undefined}
          className="flex-1 min-w-0 px-4 py-3.5 rounded-xl border-2 bg-gecko-dark-card text-white placeholder-gecko-slate border-gecko-dark-border focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 px-6 py-3.5 rounded-xl font-semibold bg-gecko-green text-gecko-dark hover:bg-gecko-green-light active:bg-gecko-green-dark focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Shortening…" : "Shorten"}
        </button>
        </div>
        <p className="text-gecko-slate text-sm">
          Add https:// if needed · Use a full domain (e.g. example.com)
        </p>
      </div>
      {showError && (
        <p id="url-error" role="alert" className="mt-2 text-sm text-red-400">
          {error ||
            (!hasValidHost(normalized)
              ? "URL must have a valid domain (e.g. example.com)"
              : "Please enter a valid URL")}
        </p>
      )}
    </form>
  )
}
