import { useState, useCallback, useEffect } from "react"
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { createLink, getLink } from "./api/links"
import Header from "./components/Header"
import Toast from "./components/Toast"
import HeroForm from "./components/HeroForm"
import DashboardPage from "./components/DashboardPage"

const RECENT_LINKS_KEY = "geckolink_recent_links"
const MAX_RECENT = 50

function parseShortCode(input) {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    if (trimmed.includes("/") || trimmed.startsWith("http")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
      const path = url.pathname.replace(/^\/+|\/+$/g, "")
      return path || null
    }
    return trimmed
  } catch {
    return trimmed
  }
}

function loadRecentLinks() {
  try {
    const raw = localStorage.getItem(RECENT_LINKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecentLinks(links) {
  try {
    localStorage.setItem(RECENT_LINKS_KEY, JSON.stringify(links.slice(0, MAX_RECENT)))
  } catch (_) {}
}

function HomePage({ onSubmit, loading, submitError }) {
  return (
    <main className="max-w-3xl mx-auto px-4 pt-16 pb-24 text-center">
      <h2 className="text-4xl font-bold tracking-tight">
        <span className="text-white">Shorten Links.</span>{" "}
        <span className="text-gecko-green">Track Everything.</span>
      </h2>
      <p className="mt-4 text-gecko-slate max-w-xl mx-auto">
        Create short, memorable links and get detailed analytics on every click. Know your audience better.
      </p>
      <div className="mt-12">
        <HeroForm onSubmit={onSubmit} isLoading={loading} />
      </div>
      {submitError && (
        <div role="alert" className="mt-6 max-w-xl mx-auto rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {submitError}
        </div>
      )}
    </main>
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [recentLinks, setRecentLinks] = useState(loadRecentLinks)
  const [selectedLink, setSelectedLink] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [lookupValue, setLookupValue] = useState("")
  const [lookupError, setLookupError] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const isDashboard = location.pathname === "/dashboard"

  useEffect(() => {
    saveRecentLinks(recentLinks)
  }, [recentLinks])

  const addToRecent = useCallback((link) => {
    setRecentLinks((prev) => {
      const rest = prev.filter((l) => l.short_code !== link.short_code)
      return [{ ...link }, ...rest]
    })
  }, [])

  const updateLinkInRecent = useCallback((shortCode, updatedLink) => {
    setRecentLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
    )
    setSelectedLink((current) =>
      current?.short_code === shortCode ? { ...current, ...updatedLink } : current
    )
  }, [])

  const handleSubmit = useCallback(
    async (url) => {
      setLoading(true)
      setSubmitError(null)
      try {
        const data = await createLink(url)
        addToRecent(data)
        setToast("Short URL created successfully!")
        setSelectedLink(data)
        navigate("/dashboard")
      } catch (err) {
        const messages = Array.isArray(err?.errors) ? err.errors : [err?.errors || "Something went wrong"]
        setSubmitError(messages.join(". "))
      } finally {
        setLoading(false)
      }
    },
    [addToRecent, navigate]
  )

  const handleLookup = useCallback(
    async (e) => {
      e.preventDefault()
      const shortCode = parseShortCode(lookupValue)
      if (!shortCode) {
        setLookupError("Paste a short link or enter its code (e.g. l or http://localhost:3000/l)")
        return
      }
      setLookupLoading(true)
      setLookupError(null)
      try {
        const data = await getLink(shortCode)
        addToRecent(data)
        setSelectedLink(data)
        setLookupValue("")
      } catch (err) {
        setLookupError(err?.errors?.[0] || "Short link not found. Check the URL or code and try again.")
      } finally {
        setLookupLoading(false)
      }
    },
    [lookupValue, addToRecent]
  )

  const lookupForm = (
    <form onSubmit={handleLookup} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Paste short link or code to view analytics"
          value={lookupValue}
          onChange={(e) => {
            setLookupValue(e.target.value)
            setLookupError(null)
          }}
          disabled={lookupLoading}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={lookupLoading}
          className="shrink-0 px-5 py-3 rounded-xl font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark disabled:opacity-60"
        >
          {lookupLoading ? "Loading…" : "View analytics"}
        </button>
      </div>
      {lookupError && <p className="text-sm text-red-400">{lookupError}</p>}
    </form>
  )

  return (
    <div className="min-h-screen bg-gecko-dark text-white font-sans antialiased bg-pattern">
      <Header isDashboard={isDashboard} />
      <Toast message={toast} visible={!!toast} onDismiss={() => setToast(null)} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage onSubmit={handleSubmit} loading={loading} submitError={submitError} />
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              recentLinks={recentLinks}
              selectedLink={selectedLink}
              onSelectLink={setSelectedLink}
              onUpdateLink={updateLinkInRecent}
              lookupForm={lookupForm}
            />
          }
        />
      </Routes>

      <footer className="border-t border-gecko-dark-border/80 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gecko-slate text-sm">
          © {new Date().getFullYear()} GeckoLink. Short links, real insights.
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
