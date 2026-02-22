import { useState, useCallback, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { createLink, getLink, getLinks } from "./api/links"
import { getSession, login, logout, signup } from "./api/auth"
import Header from "./components/Header"
import Toast from "./components/Toast"
import HeroForm from "./components/HeroForm"
import DashboardPage from "./components/DashboardPage"
import AuthModal from "./components/AuthModal"

const RECENT_LINKS_KEY = "geckolink_recent_links"
const MAX_RECENT = 50
const DASHBOARD_PAGE_SIZE = 20

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
        <p className="text-gecko-green font-medium text-sm break-all" title={createdLink.short_url}>
          {createdLink.short_url}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onCopyShortUrl(createdLink.short_url)}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-lg font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark min-h-[44px] touch-manipulation"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onViewDashboard}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-lg font-medium border border-gecko-dark-border text-gecko-slate hover:bg-gecko-dark-border hover:text-white focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark min-h-[44px] touch-manipulation"
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
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
        <span className="text-white">Shorten Links.</span>{" "}
        <span className="text-gecko-green">Track Everything.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-gecko-slate text-sm sm:text-base max-w-xl mx-auto">
        Create short, memorable links and get detailed analytics on every click. Know your audience better.
      </p>
      <div className="mt-8 sm:mt-12">
        <HeroForm onSubmit={onSubmit} isLoading={loading} />
      </div>
      {submitError && (
        <div role="alert" className="mt-4 sm:mt-6 max-w-xl mx-auto rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm text-left">
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
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [recentLinks, setRecentLinks] = useState(loadRecentLinks)
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [lookupValue, setLookupValue] = useState("")
  const [lookupError, setLookupError] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [createdLink, setCreatedLink] = useState(null)
  const dashboardLoadedRef = useRef(false)

  const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!user) saveRecentLinks(recentLinks)
  }, [user, recentLinks])

  const [linksTotal, setLinksTotal] = useState(0)
  const [linksPage, setLinksPage] = useState(1)

  const previousUserRef = useRef(user)
  if (previousUserRef.current !== user) {
    previousUserRef.current = user
    dashboardLoadedRef.current = false
  }

  useEffect(() => {
    if (!isDashboard) {
      dashboardLoadedRef.current = false
      setLinksPage(1)
      return
    }
    if (dashboardLoadedRef.current) return
    dashboardLoadedRef.current = true
    setDisplayedLinksLoading(true)

    if (!user) {
      const total = recentLinks.length
      const links = recentLinks.slice(0, DASHBOARD_PAGE_SIZE)
      setDisplayedLinks(links)
      setLinksTotal(total)
      setLinksPage(1)
      setSelectedLink((prev) => {
        if (!prev?.short_code) return prev
        const found = links.find((l) => l.short_code === prev.short_code)
        return found || prev
      })
      setDisplayedLinksLoading(false)
      dashboardLoadedRef.current = true
      return
    }
    getLinks(1, DASHBOARD_PAGE_SIZE)
      .then(({ links, total }) => {
        setDisplayedLinks(links)
        setLinksTotal(total)
        setLinksPage(1)
        setSelectedLink((prev) => {
          if (!prev?.short_code) return prev
          const found = links.find((l) => l.short_code === prev.short_code)
          return found || prev
        })
      })
      .catch(() => {
        setDisplayedLinks([])
        setLinksTotal(0)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [isDashboard, user])

  const addToRecent = useCallback((link) => {
    if (user) {
      if (isDashboard) {
        setDisplayedLinks((prev) => {
          const exists = prev.some((l) => l.short_code === link.short_code)
          if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
          return [{ ...link }, ...prev]
        })
        setLinksTotal((prev) => prev + 1)
      }
    } else {
      setRecentLinks((prev) => {
        const rest = prev.filter((l) => l.short_code !== link.short_code)
        return [{ ...link }, ...rest]
      })
      if (isDashboard) {
        setDisplayedLinks((prev) => {
          const exists = prev.some((l) => l.short_code === link.short_code)
          if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
          return [{ ...link }, ...prev]
        })
        setLinksTotal((prev) => prev + 1)
      }
    }
  }, [user, isDashboard])

  const loadMoreLinks = useCallback(() => {
    if (displayedLinks.length >= linksTotal) return
    setDisplayedLinksLoading(true)

    if (!user) {
      const nextSlice = recentLinks.slice(displayedLinks.length, displayedLinks.length + DASHBOARD_PAGE_SIZE)
      setDisplayedLinks((prev) => [...prev, ...nextSlice])
      setLinksPage((p) => p + 1)
      setDisplayedLinksLoading(false)
      return
    }
    getLinks(linksPage + 1, DASHBOARD_PAGE_SIZE)
      .then(({ links }) => {
        setDisplayedLinks((prev) => [...prev, ...links])
        setLinksPage((p) => p + 1)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [user, displayedLinks.length, linksTotal, linksPage, recentLinks])

  const hasMoreLinks = displayedLinks.length < linksTotal

  const handleLogout = useCallback(() => {
    logout().then(() => {
      setUser(null)
      setDisplayedLinks([])
      setLinksTotal(0)
      dashboardLoadedRef.current = false
    })
  }, [])

  const handleLogin = useCallback(async (email, password) => {
    const u = await login(email, password)
    setUser(u)
    setDisplayedLinks([])
    setLinksTotal(0)
    dashboardLoadedRef.current = false
  }, [])

  const handleSignup = useCallback(async (email, password, passwordConfirmation) => {
    const u = await signup(email, password, passwordConfirmation)
    setUser(u)
    setDisplayedLinks([])
    setLinksTotal(0)
    dashboardLoadedRef.current = false
  }, [])

  const updateLinkInRecent = useCallback((shortCode, updatedLink) => {
    setRecentLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
    )
    setSelectedLink((current) =>
      current?.short_code === shortCode ? { ...current, ...updatedLink } : current
    )
    setDisplayedLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
    )
  }, [])

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

  const dismissErrorAfter = (errorState, setError, ms = 5000) => {
    if (!errorState) return
    const t = setTimeout(() => setError(null), ms)
    return () => clearTimeout(t)
  }
  const clearErrorOnInteraction = (errorState, setError) => {
    if (!errorState) return
    const clear = () => setError(null)
    document.addEventListener("mousedown", clear)
    document.addEventListener("touchstart", clear, { passive: true })
    return () => {
      document.removeEventListener("mousedown", clear)
      document.removeEventListener("touchstart", clear)
    }
  }

  useEffect(() => dismissErrorAfter(lookupError, setLookupError), [lookupError])
  useEffect(() => clearErrorOnInteraction(lookupError, setLookupError), [lookupError])
  useEffect(() => dismissErrorAfter(submitError, setSubmitError), [submitError])
  useEffect(() => clearErrorOnInteraction(submitError, setSubmitError), [submitError])

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
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none disabled:opacity-60 min-h-[48px] touch-manipulation text-base"
        />
        <button
          type="submit"
          disabled={lookupLoading}
          className="shrink-0 px-5 py-3 rounded-xl font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark disabled:opacity-60 min-h-[48px] touch-manipulation"
        >
          {lookupLoading ? "Loading…" : "View analytics"}
        </button>
      </div>
      {lookupError && <p className="text-sm text-red-400">{lookupError}</p>}
    </form>
  )

  return (
    <div className="min-h-screen bg-gecko-dark text-white font-sans antialiased bg-pattern">
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      )}
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
              displayedLinks={displayedLinks}
              displayedLinksLoading={displayedLinksLoading}
              totalRecentCount={linksTotal}
              hasMoreLinks={hasMoreLinks}
              onLoadMore={loadMoreLinks}
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
              displayedLinks={displayedLinks}
              displayedLinksLoading={displayedLinksLoading}
              totalRecentCount={linksTotal}
              hasMoreLinks={hasMoreLinks}
              onLoadMore={loadMoreLinks}
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
