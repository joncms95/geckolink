import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const SCROLL_THRESHOLD = 100;
const TOP_HOVER_ZONE = 80;
const MOUSEMOVE_THROTTLE_MS = 100;

function getInitials(email) {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function Header({ user, onLogout, onOpenAuth, onOpenSignup }) {
  const location = useLocation();
  const isDashboard =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard/");
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastMouseMoveTime = useRef(0);

  const updateVisibility = useCallback(() => {
    const scrollY = window.scrollY;
    setVisible(scrollY <= SCROLL_THRESHOLD || scrollY <= lastScrollY.current);
    lastScrollY.current = scrollY;
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };
    const onMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseMoveTime.current < MOUSEMOVE_THROTTLE_MS) return;
      lastMouseMoveTime.current = now;
      if (e.clientY < TOP_HOVER_ZONE) setVisible(true);
    };
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [updateVisibility]);

  return (
    <header
      className="border-b border-gecko-dark-border/80 bg-gecko-dark/80 backdrop-blur-sm fixed left-0 right-0 top-0 z-10 safe-area-padding transition-transform duration-200 ease-out"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded-lg py-1 min-h-[44px] items-center"
        >
          <img src="/logo.png" alt="GeckoLink Logo" className="h-10 w-10" />
          <span className="text-xl sm:text-2xl font-brand font-bold tracking-wide truncate">
            GECKOLINK
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 shrink min-w-0">
          {user && (
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark min-h-[44px] ${
                isDashboard
                  ? "bg-gecko-green/20 text-gecko-green"
                  : "text-gecko-slate hover:text-white hover:bg-gecko-dark-card"
              }`}
            >
              <i
                className="fa-solid fa-chart-column text-lg sm:text-xl shrink-0"
                aria-hidden
              />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="h-9 w-9 rounded-full bg-gecko-green text-gecko-dark font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-gecko-green/50 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark touch-manipulation"
              >
                {getInitials(user.email)}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gecko-dark-border bg-gecko-dark-card shadow-lg py-2 animate-fade-in z-50">
                  <div className="px-4 py-2.5 border-b border-gecko-dark-border">
                    <p className="text-sm font-medium text-white truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gecko-slate hover:text-white hover:bg-gecko-dark-border/50 transition-colors flex items-center gap-2"
                  >
                    <i
                      className="fa-solid fa-right-from-bracket text-xs"
                      aria-hidden
                    />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 sm:px-4 py-2.5 rounded-lg font-medium border border-gecko-dark-border text-gecko-slate hover:text-white hover:bg-gecko-dark-border min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={onOpenSignup}
                className="px-3 sm:px-4 py-2.5 rounded-lg font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                Sign up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
