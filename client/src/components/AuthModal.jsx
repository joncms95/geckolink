import { useState } from "react"

export default function AuthModal({ onClose, onLogin, onSignup }) {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === "signup"

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (isSignup && password !== passwordConfirmation) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      if (isSignup) {
        await onSignup(email, password, passwordConfirmation)
      } else {
        await onLogin(email, password)
      }
      onClose()
    } catch (err) {
      setError(Array.isArray(err?.errors) ? err.errors.join(". ") : err?.errors || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl border-t sm:border border-gecko-dark-border bg-gecko-dark-card p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">{isSignup ? "Sign up" : "Log in"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-gecko-slate hover:text-white rounded-lg focus:ring-2 focus:ring-gecko-green min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Close"
          >
            <i className="fa-solid fa-times text-xl" aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gecko-slate mb-1">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gecko-dark-border bg-gecko-dark text-white focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none min-h-[48px] touch-manipulation text-base"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gecko-slate mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-gecko-dark-border bg-gecko-dark text-white focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none min-h-[48px] touch-manipulation text-base"
            />
            {isSignup && (
              <p className="mt-1 text-xs text-gecko-slate">At least 8 characters</p>
            )}
          </div>
          {isSignup && (
            <div>
              <label htmlFor="auth-password-confirm" className="block text-sm font-medium text-gecko-slate mb-1">
                Confirm password
              </label>
              <input
                id="auth-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-gecko-dark-border bg-gecko-dark text-white focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none min-h-[48px] touch-manipulation text-base"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark disabled:opacity-60 min-h-[48px] touch-manipulation"
            >
              {loading ? "…" : isSignup ? "Sign up" : "Log in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "login" : "signup")
                setError(null)
              }}
              className="py-3 px-4 rounded-lg font-medium border border-gecko-dark-border text-gecko-slate hover:text-white hover:bg-gecko-dark-border min-h-[48px] touch-manipulation"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
