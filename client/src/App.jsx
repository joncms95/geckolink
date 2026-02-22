import { useState, useCallback } from "react"
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { createLink, getLink } from "./api/links"
import Header from "./components/Header"
import Toast from "./components/Toast"
import DashboardPage from "./components/DashboardPage"
import AuthModal from "./components/AuthModal"
import HomePage from "./pages/HomePage"
import { useAuth } from "./hooks/useAuth"
import { useLinksList } from "./hooks/useLinksList"
import { useErrorDismiss } from "./hooks/useErrorDismiss"
import { loadRecentLinks, clearRecentLinks } from "./utils/recentLinksStorage"
import { parseShortCode } from "./utils/shortCode"
import { BTN_PRIMARY, INPUT_BASE } from "./constants/classes"

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, logout, signup } = useAuth()
  const [recentLinks, setRecentLinks] = useState(loadRecentLinks)
  const isDashboard =
    location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")

  const {
    displayedLinks,
    displayedLinksLoading,
    linksTotal,
    hasMoreLinks,
    selectedLink,
    setSelectedLink,
    loadMoreLinks,
    addToRecent,
    updateLinkInRecent,
    resetAfterAuthChange,
  } = useLinksList(user, isDashboard, recentLinks, setRecentLinks)

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [lookupValue, setLookupValue] = useState("")
  const [lookupError, setLookupError] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [createdLink, setCreatedLink] = useState(null)

  useErrorDismiss(lookupError, setLookupError)
  useErrorDismiss(submitError, setSubmitError)

  const resetToHomeState = useCallback(() => {
    setAuthModalOpen(false)
    setSubmitError(null)
    setLookupValue("")
    setLookupError(null)
    setToast(null)
    setCreatedLink(null)
    navigate("/")
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await logout()
    setRecentLinks([])
    clearRecentLinks()
    resetAfterAuthChange()
    resetToHomeState()
  }, [logout, resetAfterAuthChange, resetToHomeState])

  const handleLogin = useCallback(
    async (email, password) => {
      await login(email, password)
      setRecentLinks([])
      clearRecentLinks()
      resetAfterAuthChange()
      resetToHomeState()
    },
    [login, resetAfterAuthChange, resetToHomeState]
  )

  const handleSignup = useCallback(
    async (email, password, passwordConfirmation) => {
      await signup(email, password, passwordConfirmation)
      setRecentLinks([])
      clearRecentLinks()
      resetAfterAuthChange()
      resetToHomeState()
    },
    [signup, resetAfterAuthChange, resetToHomeState]
  )

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
        const messages = Array.isArray(err?.errors)
          ? err.errors
          : [err?.errors || "Something went wrong"]
        setSubmitError(messages.join(". "))
      } finally {
        setLoading(false)
      }
    },
    [addToRecent]
  )

  const handleLookup = useCallback(
    async (e) => {
      e.preventDefault()
      const shortCode = parseShortCode(lookupValue)
      if (!shortCode) {
        setLookupError(
          "Paste a short link or enter its code (e.g. l or http://localhost:3000/l)"
        )
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
        setLookupError(
          err?.errors?.[0] ||
            "Short link not found. Check the URL or code and try again."
        )
      } finally {
        setLookupLoading(false)
      }
    },
    [lookupValue, addToRecent, setSelectedLink, navigate]
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
          className={`flex-1 min-w-0 ${INPUT_BASE}`}
        />
        <button
          type="submit"
          disabled={lookupLoading}
          className={`shrink-0 px-5 py-3 rounded-xl font-medium ${BTN_PRIMARY}`}
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
                if (createdLink?.short_code)
                  navigate(`/dashboard/${createdLink.short_code}`)
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
