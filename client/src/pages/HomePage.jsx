import HeroForm from "../components/HeroForm"
import CreatedLinkResult from "../components/CreatedLinkResult"

export default function HomePage({
  onSubmit,
  loading,
  submitError,
  createdLink,
  onCopyShortUrl,
  onViewDashboard,
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
        <span className="text-white">Shorten Links.</span>{" "}
        <span className="text-gecko-green">Track Everything.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-gecko-slate text-sm sm:text-base max-w-xl mx-auto">
        Create short, memorable links and get detailed analytics on every click. Know your audience better.
      </p>
      <div className="mt-8 sm:mt-12">
        <HeroForm onSubmit={onSubmit} isLoading={loading} />
      </div>
      {submitError && (
        <div
          role="alert"
          className="mt-4 sm:mt-6 max-w-xl mx-auto rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm text-left"
        >
          {submitError}
        </div>
      )}
      {createdLink && (
        <CreatedLinkResult
          createdLink={createdLink}
          onCopyShortUrl={onCopyShortUrl}
          onViewDashboard={onViewDashboard}
        />
      )}
    </main>
  )
}
