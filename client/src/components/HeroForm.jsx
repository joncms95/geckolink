import { useCallback, useEffect, useState } from "react"
import { ERROR_DISMISS_MS } from "../constants"
import { hasValidHost, normalizeUrl } from "../utils/url"

export default function HeroForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  const normalized = normalizeUrl(url)
  const isValid = /^https?:\/\/\S+$/i.test(normalized) && hasValidHost(normalized)
  const showError = touched && (error || (url.trim() && !isValid))

  useEffect(() => {
    if (!showError) return
    const t = setTimeout(() => {
      setError(null)
      setTouched(false)
    }, ERROR_DISMISS_MS)
    return () => clearTimeout(t)
  }, [showError])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      setTouched(true)
      setError(null)
      if (!url.trim()) {
        setError("Please enter a URL")
        return
      }
      if (!isValid) {
        setError(!hasValidHost(normalized) ? "URL must have a valid domain (e.g. example.com)" : "Please enter a valid URL")
        return
      }
      onSubmit(normalized)
    },
    [url, normalized, isValid, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
      <div className="w-full flex flex-col gap-2 sm:gap-4">
        <label className="sr-only" htmlFor="hero-url-input">
          Long URL to shorten
        </label>
        <input
          id="hero-url-input"
          type="text"
          inputMode="url"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Enter your long URL here..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          onBlur={() => setTouched(true)}
          disabled={isLoading}
          aria-invalid={showError}
          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl border border-gecko-dark-border bg-gecko-dark-card text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none transition-all disabled:opacity-60 text-base min-h-[48px] touch-manipulation"
        />
      </div>
      {showError && (
        <p role="alert" className="text-sm text-red-400 -mt-1 w-full text-center sm:text-center">
          {error ||
            (!hasValidHost(normalized)
              ? "URL must have a valid domain (e.g. example.com)"
              : "Please enter a valid URL")}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full max-w-md px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-gecko-dark bg-gecko-green hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
      >
        {isLoading ? "Shortening…" : "Shorten URL"}
      </button>
    </form>
  )
}
