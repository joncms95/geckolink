import { useState, useCallback } from "react"
import { createLink } from "./api/links"
import UrlForm from "./components/UrlForm"
import ResultCard from "./components/ResultCard"
import AnalyticsDashboard from "./components/AnalyticsDashboard"

export default function App() {
  const [link, setLink] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (url) => {
    setLoading(true)
    setSubmitError(null)
    try {
      const data = await createLink(url)
      setLink(data)
    } catch (err) {
      const messages = Array.isArray(err?.errors) ? err.errors : [err?.errors || "Something went wrong"]
      setSubmitError(messages.join(". "))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setLink(null)
    setSubmitError(null)
  }, [])

  return (
    <div className="min-h-screen bg-gecko-dark text-white font-sans antialiased">
      <header className="border-b border-gecko-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-gecko-green">Gecko</span>
            <span>Link</span>
          </h1>
          <p className="mt-1 text-sm text-gecko-slate">Short links, real insights</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col items-center gap-10">
        <section className="w-full flex flex-col items-center gap-4">
          <UrlForm onSubmit={handleSubmit} isLoading={loading} />
          {submitError && (
            <div role="alert" className="w-full max-w-2xl rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
              {submitError}
            </div>
          )}
        </section>

        {link && (
          <>
            <ResultCard link={link} onReset={handleReset} />
            <AnalyticsDashboard shortCode={link.short_code} />
          </>
        )}

        {!link && (
          <p className="text-gecko-slate text-sm text-center max-w-md">
            Paste a long URL above to get a short link and view click analytics by country and time.
          </p>
        )}
      </main>

      <footer className="border-t border-gecko-dark-border mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-gecko-slate text-sm">
          GeckoLink · URL shortener with analytics
        </div>
      </footer>
    </div>
  )
}
