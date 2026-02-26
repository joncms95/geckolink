import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatApiError } from "../api/errors";
import { createLink } from "../api/links";
import { useAuth } from "../hooks/useAuth";
import useCopyToClipboard from "../hooks/useCopyToClipboard";
import { useToast } from "../hooks/useToast";
import CreatedLinkResult from "../components/CreatedLinkResult";
import HeroForm from "../components/HeroForm";
import InlineError from "../components/ui/InlineError";

export default function HomePage({ onOpenSignup }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { copyWithToast } = useCopyToClipboard();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);

  const handleSubmit = useCallback(
    async (url) => {
      setLoading(true);
      setError(null);
      setCreatedLink(null);
      try {
        const data = await createLink(url);
        showToast("Short URL created!");
        setCreatedLink(data);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
        <span className="text-white">Shorten Links.</span>{" "}
        <span className="text-gecko-green">Track Everything.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-gecko-slate text-sm sm:text-base max-w-xl mx-auto">
        Create short links and get detailed analytics on every click. Know your
        audience better.
      </p>
      {!user && onOpenSignup && (
        <p className="mt-4 sm:mt-5">
          <button
            type="button"
            onClick={onOpenSignup}
            className="animate-blink-soft inline-flex items-center gap-2 rounded-lg border border-gecko-green/50 bg-gecko-green/10 px-4 py-2.5 text-sm font-medium text-gecko-green hover:bg-gecko-green/20 hover:border-gecko-green transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark"
          >
            <i className="fa-solid fa-chart-column" aria-hidden />
            Sign up and login to view your link analytics
          </button>
        </p>
      )}
      <div className="mt-8 sm:mt-12">
        <HeroForm onSubmit={handleSubmit} isLoading={loading} />
      </div>
      {error && (
        <InlineError
          message={error}
          className="mt-4 sm:mt-6 max-w-xl mx-auto"
        />
      )}
      {createdLink && (
        <CreatedLinkResult
          createdLink={createdLink}
          onCopyShortUrl={copyWithToast}
          onViewDashboard={
            user ? () => navigate(`/dashboard/${createdLink.key}`) : undefined
          }
        />
      )}
    </main>
  );
}
