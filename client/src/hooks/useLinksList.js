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
          if (!prev?.short_code) return prev
          return links.find((l) => l.short_code === prev.short_code) || prev
        })
      })
      .catch(() => {
        setDisplayedLinks([])
        setLinksTotal(0)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [user])

  const addToDisplayedLinks = useCallback((link) => {
    setDisplayedLinks((prev) => {
      const exists = prev.some((l) => l.short_code === link.short_code)
      if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
      return [{ ...link }, ...prev]
    })
    setLinksTotal((prev) => prev + 1)
  }, [])

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

  const updateLinkInList = useCallback((shortCode, updatedLink) => {
    setSelectedLink((current) =>
      current?.short_code === shortCode ? { ...current, ...updatedLink } : current
    )
    setDisplayedLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
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
    addToDisplayedLinks,
    updateLinkInList,
  }
}
