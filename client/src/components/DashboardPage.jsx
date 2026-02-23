import { useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getLink } from "../api/links"
import { scrollToTop } from "../utils/scroll"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../hooks/useToast"
import { useLinksList } from "../hooks/useLinksList"
import { useDashboardStats } from "../hooks/useDashboardStats"
import useCopyToClipboard from "../hooks/useCopyToClipboard"
import LinkList from "./dashboard/LinkList"
import LinkDetailView from "./dashboard/LinkDetailView"
import DashboardListView from "./dashboard/DashboardListView"
import { SCROLL_TARGETS } from "../constants"

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
    sort,
    goToPage,
    changeSort,
    selectedLink,
    setSelectedLink,
  } = useLinksList(user)

  const stats = useDashboardStats(user)

  useEffect(() => {
    if (keyFromUrl) scrollToTop()
  }, [keyFromUrl])

  useEffect(() => {
    if (!keyFromUrl) return

    const inList = displayedLinks.find((l) => l.key === keyFromUrl)
    if (inList) {
      setSelectedLink(inList)
      return
    }

    getLink(keyFromUrl)
      .then((link) => setSelectedLink(link))
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

  const handleBackToDashboard = useCallback(() => {
    navigate("/dashboard")
    requestAnimationFrame(() => scrollToTop(SCROLL_TARGETS.DASHBOARD))
  }, [navigate])

  const handlePageChange = useCallback(
    (page) => {
      if (keyFromUrl) navigate("/dashboard")
      goToPage({ page, onLoaded: () => scrollToTop(SCROLL_TARGETS.LINK_LIST) })
    },
    [goToPage, navigate, keyFromUrl]
  )

  const isDetailView = Boolean(keyFromUrl)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {isDetailView ? (
        <LinkDetailView
          link={selectedLink}
          keyFromUrl={keyFromUrl}
          onBack={handleBackToDashboard}
        />
      ) : (
        <DashboardListView stats={stats} onLookupResult={handleLookupResult} />
      )}

      <LinkList
        links={displayedLinks}
        linksTotal={linksTotal}
        loading={displayedLinksLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        sort={sort}
        onSortChange={changeSort}
        onPageChange={handlePageChange}
        onViewStats={handleViewStats}
        onCopy={handleCopy}
      />
    </div>
  )
}
