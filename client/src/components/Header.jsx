import { Link, useLocation } from "react-router-dom"

export default function Header() {
  const location = useLocation()
  const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")

  return (
    <header className="border-b border-gecko-dark-border/80 bg-gecko-dark/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark rounded-lg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gecko-green text-gecko-dark shrink-0">
            <i className="fa-solid fa-link text-xl" aria-hidden />
          </span>
          <span className="text-xl font-semibold tracking-tight">GeckoLink</span>
        </Link>
        <nav>
          <Link
            to="/dashboard"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark ${
              isDashboard
                ? "bg-gecko-green/20 text-gecko-green"
                : "text-gecko-slate hover:text-white hover:bg-gecko-dark-card"
            }`}
          >
            <i className="fa-solid fa-chart-column text-xl" aria-hidden />
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
