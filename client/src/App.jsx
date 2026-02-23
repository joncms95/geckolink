import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { ToastProvider } from "./hooks/useToast"
import Header from "./components/Header"
import AuthModal from "./components/AuthModal"
import HomePage from "./pages/HomePage"
import DashboardPage from "./components/DashboardPage"

function AppContent() {
  const { user, login, logout, signup } = useAuth()
  const [authModalMode, setAuthModalMode] = useState(null)

  return (
    <div className="min-h-screen bg-gecko-dark text-white font-sans antialiased bg-pattern">
      <Header
        user={user}
        onLogout={logout}
        onOpenAuth={() => setAuthModalMode("login")}
        onOpenSignup={() => setAuthModalMode("signup")}
      />
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onLogin={login}
          onSignup={signup}
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard/:key?"
          element={user ? <DashboardPage /> : <Navigate to="/" replace />}
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
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
