import { useState, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { ToastProvider } from "./hooks/useToast"
import Header from "./components/Header"
import AuthModal from "./components/AuthModal"
import HomePage from "./pages/HomePage"
import DashboardPage from "./components/DashboardPage"
import NotFoundPage from "./pages/NotFoundPage"

const ParticleBackground = lazy(() => import("./components/ParticleBackground"))

function AppContent() {
  const { user, login, logout, signup } = useAuth()
  const [authModalMode, setAuthModalMode] = useState(null)

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
          onOpenAuth={() => setAuthModalMode("login")}
          onOpenSignup={() => setAuthModalMode("signup")}
        />
        {/* Spacer: must match the fixed header height (~76px on mobile, ~80px on sm+) */}
        <div className="h-20 shrink-0" aria-hidden />
        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onLogin={login}
            onSignup={signup}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={<HomePage onOpenSignup={() => setAuthModalMode("signup")} />}
          />
          <Route
            path="/dashboard/:key?"
            element={user ? <DashboardPage /> : <Navigate to="/" replace />}
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
