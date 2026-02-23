import { useState, useCallback, useEffect, useRef } from "react"
import { getMyLinks } from "../api/links"
import { DASHBOARD_PAGE_SIZE } from "../constants"

export function useLinksList(user) {
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [linksTotal, setLinksTotal] = useState(0)
  const [linksPage, setLinksPage] = useState(1)
  const loadedRef = useRef(false)

  // Reset when user changes (login/logout)
  useEffect(() => {
    loadedRef.current = false
    setDisplayedLinks([])
    setLinksTotal(0)
    setSelectedLink(null)
    setLinksPage(1)
  }, [user])

  // Fetch first page of user's links
  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true
    setDisplayedLinksLoading(true)

    getMyLinks(1, DASHBOARD_PAGE_SIZE)
      .then(({ links, total }) => {
        setDisplayedLinks(links)
        setLinksTotal(total)
        setLinksPage(1)
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
  }, [user])

  const loadMoreLinks = useCallback(() => {
    if (!user || displayedLinks.length >= linksTotal) return
    setDisplayedLinksLoading(true)

    getMyLinks(linksPage + 1, DASHBOARD_PAGE_SIZE)
      .then(({ links }) => {
        setDisplayedLinks((prev) => [...prev, ...links])
        setLinksPage((p) => p + 1)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [user, displayedLinks.length, linksTotal, linksPage])

  const updateLinkInList = useCallback((key, updatedLink) => {
    setSelectedLink((current) =>
      current?.key === key ? { ...current, ...updatedLink } : current
    )
    setDisplayedLinks((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...updatedLink } : l))
    )
  }, [])

  return {
    displayedLinks,
    displayedLinksLoading,
    linksTotal,
    hasMoreLinks: displayedLinks.length < linksTotal,
    selectedLink,
    setSelectedLink,
    loadMoreLinks,
    updateLinkInList,
  }
}
