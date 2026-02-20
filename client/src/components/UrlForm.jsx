import { useState } from "react"

const INPUT_PLACEHOLDER = "https://example.com/your-long-url"

export default function UrlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  const isValid = /^https?:\/\/\S+$/i.test(url.trim())
  const showError = touched && (error || (url.trim() && !isValid))

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    setError(null)
    const trimmed = url.trim()
    if (!trimmed) {
      setError("Please enter a URL")
      return
    }
    if (!isValid) {
      setError("URL must start with http:// or https://")
      return
    }
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor="url-input">
          Long URL to shorten
        </label>
        <input
          id="url-input"
          type="url"
          inputMode="url"
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
      {showError && (
        <p id="url-error" role="alert" className="mt-2 text-sm text-red-400">
          {error || "URL must start with http:// or https://"}
        </p>
      )}
    </form>
  )
}
