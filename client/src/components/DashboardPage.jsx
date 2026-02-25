import { useCallback, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getLink } from "../api/links"
import { SCROLL_TARGETS } from "../constants"
import { useAuth } from "../hooks/useAuth"
import useCopyToClipboard from "../hooks/useCopyToClipboard"
import { useDashboardStats } from "../hooks/useDashboardStats"
import { useLinksList } from "../hooks/useLinksList"
import { useToast } from "../hooks/useToast"
import { scrollToTop } from "../utils/scroll"
import DashboardListView from "./dashboard/DashboardListView"
import LinkDetailView from "./dashboard/LinkDetailView"
import LinkList from "./dashboard/LinkList"

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
    refetch: refetchLinks,
    selectedLink,
    setSelectedLink,
  } = useLinksList(user)

  const stats = useDashboardStats(user)
  const { refetch: refetchStats } = stats
  const prevKeyFromUrl = useRef(keyFromUrl)

  useEffect(() => {
    if (keyFromUrl) scrollToTop()
  }, [keyFromUrl])

  useEffect(() => {
    const wasDetailView = Boolean(prevKeyFromUrl.current)
    const isListView = !keyFromUrl
    prevKeyFromUrl.current = keyFromUrl
    if (wasDetailView && isListView) {
      refetchStats()
      refetchLinks()
    }
  }, [keyFromUrl, refetchStats, refetchLinks])

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
