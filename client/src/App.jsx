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

function CreatedLinkResult({ createdLink, onCopyShortUrl, onViewDashboard }) {
  const [iconError, setIconError] = useState(false)
  const showIcon = createdLink?.icon_url && !iconError
  return (
    <div className="mt-8 max-w-2xl mx-auto rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-6 text-left">
      <div className="flex gap-4 mb-4">
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
          <p className="text-gecko-slate text-sm font-medium mb-1">Target URL</p>
          <p className="text-white text-sm truncate" title={createdLink.url}>
            {createdLink.url}
          </p>
        </div>
      </div>
      <p className="text-gecko-slate text-sm font-medium mb-2">Title</p>
      <p className="text-white text-sm truncate mb-4" title={createdLink.title || ""}>
        {createdLink.title?.trim() || "Fetching…"}
      </p>
      <p className="text-gecko-slate text-sm font-medium mb-2">Short URL</p>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <p className="text-gecko-green font-medium text-sm truncate flex-1 min-w-0" title={createdLink.short_url}>
          {createdLink.short_url}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onCopyShortUrl(createdLink.short_url)}
            className="px-4 py-2 rounded-lg font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onViewDashboard}
            className="px-4 py-2 rounded-lg font-medium border border-gecko-dark-border text-gecko-slate hover:bg-gecko-dark-border hover:text-white focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark"
          >
            View analytics
          </button>
        </div>
      </div>
    </div>
  )
}

function HomePage({ onSubmit, loading, submitError, createdLink, onCopyShortUrl, onViewDashboard }) {
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
      {createdLink && (
        <CreatedLinkResult
          createdLink={createdLink}
          onCopyShortUrl={onCopyShortUrl}
          onViewDashboard={onViewDashboard}
        />
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
  const [createdLink, setCreatedLink] = useState(null)

  const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")

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

  // On dashboard view: refetch all recent links from API and replace list with fresh data.
  // Removes stale/deleted links (404) and ensures counts/titles are accurate.
  useEffect(() => {
    if (!isDashboard || recentLinks.length === 0) return
    const codes = recentLinks.map((l) => l?.short_code).filter(Boolean)
    if (codes.length === 0) return
    let cancelled = false
    Promise.allSettled(codes.map((code) => getLink(code)))
      .then((results) => {
        if (cancelled) return
        const freshList = results
          .map((p) => (p.status === "fulfilled" && p.value ? p.value : null))
          .filter(Boolean)
        setRecentLinks(freshList)
        setSelectedLink((prev) => {
          if (!prev?.short_code) return prev
          const found = freshList.find((l) => l.short_code === prev.short_code)
          return found || null
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isDashboard, recentLinks.length])

  const handleSubmit = useCallback(
    async (url) => {
      setLoading(true)
      setSubmitError(null)
      setCreatedLink(null)
      try {
        const data = await createLink(url)
        addToRecent(data)
        setToast("Short URL created!")
        setCreatedLink(data)
      } catch (err) {
        const messages = Array.isArray(err?.errors) ? err.errors : [err?.errors || "Something went wrong"]
        setSubmitError(messages.join(". "))
      } finally {
        setLoading(false)
      }
    },
    [addToRecent]
  )

  const updateCreatedLink = useCallback((updates) => {
    setCreatedLink((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  // Refetch created link after a delay so title (from TitleFetcherJob) appears when ready
  useEffect(() => {
    if (!createdLink?.short_code || createdLink.title?.trim()) return
    const id = setTimeout(() => {
      getLink(createdLink.short_code)
        .then((data) => updateCreatedLink(data))
        .catch(() => {})
    }, 2500)
    return () => clearTimeout(id)
  }, [createdLink?.short_code, createdLink?.title, updateCreatedLink])

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
        navigate(`/dashboard/${data.short_code}`)
      } catch (err) {
        setLookupError(err?.errors?.[0] || "Short link not found. Check the URL or code and try again.")
      } finally {
        setLookupLoading(false)
      }
    },
    [lookupValue, addToRecent, navigate]
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
            <HomePage
              onSubmit={handleSubmit}
              loading={loading}
              submitError={submitError}
              createdLink={createdLink}
              onCopyShortUrl={async (text) => {
                try {
                  await navigator.clipboard.writeText(text)
                  setToast("Copied to clipboard!")
                } catch (_) {}
              }}
              onViewDashboard={() => {
                if (createdLink?.short_code) navigate(`/dashboard/${createdLink.short_code}`)
              }}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              recentLinks={recentLinks}
              selectedLink={selectedLink}
              onSelectLink={setSelectedLink}
              onAddToRecent={addToRecent}
              onUpdateLink={updateLinkInRecent}
              onNavigateToStats={navigate}
              lookupForm={lookupForm}
            />
          }
        />
        <Route
          path="/dashboard/:shortCode"
          element={
            <DashboardPage
              recentLinks={recentLinks}
              selectedLink={selectedLink}
              onSelectLink={setSelectedLink}
              onAddToRecent={addToRecent}
              onUpdateLink={updateLinkInRecent}
              onNavigateToStats={navigate}
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
