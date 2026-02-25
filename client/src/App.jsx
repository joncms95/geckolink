import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { ToastProvider } from "./hooks/useToast"
import { useAuthModal } from "./hooks/useAuthModal"
import Header from "./components/Header"
import AuthModal from "./components/AuthModal"
import HomePage from "./pages/HomePage"
import NotFoundPage from "./pages/NotFoundPage"

const ParticleBackground = lazy(() => import("./components/ParticleBackground"))
const DashboardPage = lazy(() => import("./components/DashboardPage"))

function AppContent() {
  const { user, login, logout, signup } = useAuth()
  const { authModalMode, openLogin, openSignup, close } = useAuthModal()

  return (
    <div className="min-h-screen bg-gecko-dark text-white font-sans antialiased bg-pattern relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
      </div>

      <div className="relative z-10">
        <Header
          user={user}
          onLogout={logout}
          onOpenAuth={openLogin}
          onOpenSignup={openSignup}
        />
        {/* Spacer: must match the fixed header height (~76px on mobile, ~80px on sm+) */}
        <div className="h-20 shrink-0" aria-hidden />
        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onClose={close}
            onLogin={login}
            onSignup={signup}
          />
        )}

        <Routes>
          <Route path="/" element={<HomePage onOpenSignup={openSignup} />} />
          <Route
            path="/dashboard/:key?"
            element={
              user ? (
                <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-gecko-slate">Loading…</div>}>
                  <DashboardPage />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <footer className="border-t border-gecko-dark-border/80 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gecko-slate text-sm">
            © {new Date().getFullYear()} GeckoLink. Short links, real insights.
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
