import { useState, useCallback, useEffect, useRef } from "react"
import { getMyLinks } from "../api/links"
import { LINKS_PER_PAGE } from "../constants"

export function useLinksList(user) {
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [linksTotal, setLinksTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const loadedRef = useRef(false)

  const totalPages = Math.max(1, Math.ceil(linksTotal / LINKS_PER_PAGE))

  const fetchPage = useCallback(
    (page) => {
      if (!user) return
      setDisplayedLinksLoading(true)
      getMyLinks(page)
        .then(({ links, total }) => {
          setDisplayedLinks(links)
          setLinksTotal(total)
          setCurrentPage(page)
          setSelectedLink((prev) => {
            if (!prev?.key) return prev
            return links.find((l) => l.key === prev.key) || prev
          })
        })
        .catch(() => {
          setDisplayedLinks([])
          setLinksTotal(0)
        })
        .finally(() => setDisplayedLinksLoading(false))
    },
    [user]
  )

  // Reset when user changes (login/logout)
  useEffect(() => {
    loadedRef.current = false
    setDisplayedLinks([])
    setLinksTotal(0)
    setSelectedLink(null)
    setCurrentPage(1)
  }, [user])

  // Fetch first page on mount / when user becomes available
  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true
    fetchPage(1)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return
      fetchPage(page)
    },
    [fetchPage, totalPages]
  )

  return {
    displayedLinks,
    displayedLinksLoading,
    linksTotal,
    currentPage,
    totalPages,
    goToPage,
    selectedLink,
    setSelectedLink,
  }
}
