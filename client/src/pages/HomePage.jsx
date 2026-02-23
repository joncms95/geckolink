import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { createLink } from "../api/links"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../hooks/useToast"
import useCopyToClipboard from "../hooks/useCopyToClipboard"
import { formatApiError } from "../utils/error"
import HeroForm from "../components/HeroForm"
import CreatedLinkResult from "../components/CreatedLinkResult"

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { copy } = useCopyToClipboard()

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [createdLink, setCreatedLink] = useState(null)

  const handleSubmit = useCallback(
    async (url) => {
      setLoading(true)
      setSubmitError(null)
      setCreatedLink(null)
      try {
        const data = await createLink(url)
        showToast("Short URL created!")
        setCreatedLink(data)
      } catch (err) {
        setSubmitError(formatApiError(err))
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  const handleCopyShortUrl = useCallback(
    async (text) => {
      const ok = await copy(text)
      if (ok) showToast("Copied to clipboard!")
    },
    [copy, showToast]
  )

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
        <span className="text-white">Shorten Links.</span>{" "}
        <span className="text-gecko-green">Track Everything.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-gecko-slate text-sm sm:text-base max-w-xl mx-auto">
        Create short links and get detailed analytics on every click. Know your audience better.
      </p>
      <div className="mt-8 sm:mt-12">
        <HeroForm onSubmit={handleSubmit} isLoading={loading} />
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
          onCopyShortUrl={handleCopyShortUrl}
          onViewDashboard={
            user ? () => navigate(`/dashboard/${createdLink.short_code}`) : undefined
          }
        />
      )}
    </main>
  )
}
