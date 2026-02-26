import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NotFoundPage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full text-center">
        <p
          className="text-6xl sm:text-7xl font-bold text-gecko-green/30 select-none"
          aria-hidden
        >
          404
        </p>
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">
          Page not found
        </h1>
        <p className="mt-2 text-gecko-slate text-sm sm:text-base">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium bg-gecko-green text-gecko-dark hover:bg-gecko-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark transition-colors"
          >
            Go to home
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium border border-gecko-dark-border text-gecko-slate hover:text-white hover:bg-gecko-dark-card focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
