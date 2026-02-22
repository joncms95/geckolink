import { useState, useCallback, useEffect, useRef } from "react"

const URL_PLACEHOLDER = "Enter your long URL here..."

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

  const clearError = useCallback(() => {
    setError(null)
    setTouched(false)
  }, [])

  useEffect(() => {
    if (!showError) return
    const t = setTimeout(clearError, 5000)
    return () => clearTimeout(t)
  }, [showError, clearError])

  const formRef = useRef(null)
  useEffect(() => {
    if (!showError) return
    const onInteraction = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) clearError()
    }
    document.addEventListener("mousedown", onInteraction)
    document.addEventListener("touchstart", onInteraction, { passive: true })
    return () => {
      document.removeEventListener("mousedown", onInteraction)
      document.removeEventListener("touchstart", onInteraction)
    }
  }, [showError, clearError])

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
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
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
          placeholder={URL_PLACEHOLDER}
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
