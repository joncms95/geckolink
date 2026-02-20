import { useState, useCallback } from "react"

const URL_PLACEHOLDER = "Enter your long URL here..."
const CUSTOM_CODE_MAX = 15

function normalizeUrl(input) {
  const trimmed = input.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function hasValidHost(urlString) {
  try {
    const url = new URL(urlString)
    const host = url.hostname
    return host === "localhost" || host.includes(".")
  } catch {
    return false
  }
}

export default function HeroForm({ onSubmit, isLoading }) {
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      <div className="w-full flex flex-col gap-4">
        <label className="sr-only" htmlFor="hero-url-input">
          Long URL to shorten
        </label>
        <input
          id="hero-url-input"
          type="text"
          inputMode="url"
          autoCorrect="off"
          spellCheck="false"
          placeholder={URL_PLACEHOLDER}
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          onBlur={() => setTouched(true)}
          disabled={isLoading}
          aria-invalid={showError}
          className="w-full px-5 py-4 rounded-xl border border-gecko-dark-border bg-gecko-dark-card text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none transition-all disabled:opacity-60"
        />
        <div className="relative">
          <label className="sr-only" htmlFor="hero-custom-code">
            Custom short code (optional)
          </label>
          <input
            id="hero-custom-code"
            type="text"
            maxLength={CUSTOM_CODE_MAX}
            placeholder="Custom short code (optional, max 15 chars)"
            readOnly
            className="w-full px-5 py-4 rounded-xl border border-gecko-dark-border bg-gecko-dark-card/50 text-gecko-slate placeholder-gecko-slate outline-none cursor-default pr-16"
            title="Short codes are auto-generated"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gecko-slate text-sm tabular-nums pointer-events-none">
            0/{CUSTOM_CODE_MAX}
          </span>
        </div>
        <p className="text-gecko-slate text-xs -mt-2">
          Short codes are auto-generated. Custom codes may be supported later.
        </p>
      </div>
      {showError && (
        <p role="alert" className="text-sm text-red-400 -mt-2 w-full text-center">
          {error ||
            (!hasValidHost(normalized)
              ? "URL must have a valid domain (e.g. example.com)"
              : "Please enter a valid URL")}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full max-w-md px-8 py-4 rounded-xl font-semibold text-gecko-dark bg-gecko-green hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Shortening…" : "Shorten URL"}
      </button>
    </form>
  )
}
