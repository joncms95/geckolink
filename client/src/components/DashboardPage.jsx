import { useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getLink } from "../api/links"
import { scrollToTop } from "../utils/scroll"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../hooks/useToast"
import { useLinksList } from "../hooks/useLinksList"
import useCopyToClipboard from "../hooks/useCopyToClipboard"
import MetricCard from "./dashboard/MetricCard"
import LinkList from "./dashboard/LinkList"
import LinkDetailView from "./dashboard/LinkDetailView"
import LookupForm from "./dashboard/LookupForm"

export default function DashboardPage() {
  const { key: keyFromUrl } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { copy } = useCopyToClipboard()

  const {
    displayedLinks,
    displayedLinksLoading,
    linksTotal,
    currentPage,
    totalPages,
    goToPage,
    selectedLink,
    setSelectedLink,
  } = useLinksList(user)

  useEffect(() => {
    if (keyFromUrl) scrollToTop()
  }, [keyFromUrl])

  // Resolve key from URL to a link object
  useEffect(() => {
    if (!keyFromUrl) return

    const inList = displayedLinks.find((l) => l.key === keyFromUrl)
    if (inList) {
      setSelectedLink(inList)
      return
    }

    getLink(keyFromUrl)
      .then((link) => {
        setSelectedLink(link)
      })
      .catch(() => {})
  }, [keyFromUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(
    async (text) => {
      const ok = await copy(text)
      if (ok) showToast("Copied to clipboard!")
    },
    [copy, showToast]
  )

  const handleViewStats = useCallback(
    (link) => {
      if (link.key === keyFromUrl) scrollToTop()
      navigate(`/dashboard/${link.key}`)
    },
    [navigate, keyFromUrl]
  )

  const handleLookupResult = useCallback(
    (link) => {
      setSelectedLink(link)
      navigate(`/dashboard/${link.key}`)
    },
    [setSelectedLink, navigate]
  )

  const handlePageChange = useCallback(
    (page) => {
      goToPage(page)
      if (keyFromUrl) navigate("/dashboard")
      scrollToTop()
    },
    [goToPage, navigate, keyFromUrl]
  )

  const isDetailView = Boolean(keyFromUrl)
  const totalLinks = linksTotal
  const totalClicks = displayedLinks.reduce((s, l) => s + (l.clicks_count || 0), 0)
  const avgClicks = totalLinks ? (totalClicks / totalLinks).toFixed(1) : "0.0"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {isDetailView ? (
        <LinkDetailView
          link={selectedLink}
          keyFromUrl={keyFromUrl}
          onBack={() => navigate("/dashboard")}
        />
      ) : (
        <>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard label="Total Links" value={totalLinks} icon="fa-link" />
            <MetricCard label="Total Clicks" value={totalClicks} icon="fa-chart-line" />
            <MetricCard label="Avg. Clicks/Link" value={avgClicks} icon="fa-chart-column" />
            <MetricCard label="Top Location" value="N/A" icon="fa-globe" />
          </div>
          <LookupForm onResult={handleLookupResult} />
        </>
      )}

      <LinkList
        links={displayedLinks}
        linksTotal={linksTotal}
        loading={displayedLinksLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onViewStats={handleViewStats}
        onCopy={handleCopy}
      />
    </div>
  )
}
