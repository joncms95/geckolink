import { Link, useLocation } from "react-router-dom"

export default function Header({ user, onLogout, onOpenAuth }) {
  const location = useLocation()
  const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")

  return (
    <header className="border-b border-gecko-dark-border/80 bg-gecko-dark/80 backdrop-blur-sm sticky top-0 z-10 safe-area-padding">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded-lg py-1 min-h-[44px] items-center"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gecko-green text-gecko-dark">
            <i className="fa-solid fa-link text-lg sm:text-xl" aria-hidden />
          </span>
          <span className="text-lg sm:text-xl font-semibold tracking-tight truncate">GeckoLink</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 shrink min-w-0">
          {user && (
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark min-h-[44px] ${
                isDashboard
                  ? "bg-gecko-green/20 text-gecko-green"
                  : "text-gecko-slate hover:text-white hover:bg-gecko-dark-card"
              }`}
            >
              <i className="fa-solid fa-chart-column text-lg sm:text-xl shrink-0" aria-hidden />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          {user ? (
            <>
              <span
                className="hidden sm:inline-block text-gecko-slate text-sm truncate max-w-[90px] md:max-w-[180px]"
                title={user.email}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2.5 rounded-lg text-gecko-slate hover:text-white hover:bg-gecko-dark-border text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 sm:px-4 py-2.5 rounded-lg font-medium border border-gecko-dark-border text-gecko-slate hover:text-white hover:bg-gecko-dark-border min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Log in
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
