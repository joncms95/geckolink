import { useState, useCallback, useEffect, useRef } from "react"
import { getMyLinks } from "../api/links"
import { DASHBOARD_PAGE_SIZE } from "../constants"

export function useLinksList(user, isDashboard) {
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [linksTotal, setLinksTotal] = useState(0)
  const [linksPage, setLinksPage] = useState(1)
  const dashboardLoadedRef = useRef(false)
  const previousUserRef = useRef(user)
  const displayedLinksRef = useRef(displayedLinks)
  displayedLinksRef.current = displayedLinks

  if (previousUserRef.current !== user) {
    previousUserRef.current = user
    dashboardLoadedRef.current = false
  }

  // Login-only dashboard: fetch current user's links from API (created_at desc).
  useEffect(() => {
    if (!isDashboard || !user) {
      if (!isDashboard) dashboardLoadedRef.current = false
      setLinksPage(1)
      return
    }
    if (dashboardLoadedRef.current) return
    dashboardLoadedRef.current = true
    setDisplayedLinksLoading(true)
    getMyLinks(1, DASHBOARD_PAGE_SIZE)
      .then(({ links, total }) => {
        setDisplayedLinks(links)
        setLinksTotal(total)
        setLinksPage(1)
        setSelectedLink((prev) => {
          if (!prev?.short_code) return prev
          const found = links.find((l) => l.short_code === prev.short_code)
          return found || prev
        })
      })
      .catch(() => {
        setDisplayedLinks([])
        setLinksTotal(0)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [isDashboard, user])

  const addToDisplayedLinks = useCallback((link) => {
    if (!user || !isDashboard) return
    const alreadyInList = displayedLinksRef.current.some((l) => l?.short_code === link?.short_code)
    setDisplayedLinks((prev) => {
      const exists = prev.some((l) => l.short_code === link.short_code)
      if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
      return [{ ...link }, ...prev]
    })
    if (!alreadyInList) setLinksTotal((prev) => prev + 1)
  }, [user, isDashboard])

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

  const resetAfterAuthChange = useCallback(() => {
    setDisplayedLinks([])
    setLinksTotal(0)
    setSelectedLink(null)
    setLinksPage(1)
    dashboardLoadedRef.current = false
  }, [])

  const updateLinkInList = useCallback((shortCode, updatedLink) => {
    setSelectedLink((current) =>
      current?.short_code === shortCode ? { ...current, ...updatedLink } : current
    )
    setDisplayedLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
    )
  }, [])

  const hasMoreLinks = displayedLinks.length < linksTotal

  return {
    displayedLinks,
    displayedLinksLoading,
    linksTotal,
    hasMoreLinks,
    selectedLink,
    setSelectedLink,
    loadMoreLinks,
    addToDisplayedLinks,
    updateLinkInList,
    resetAfterAuthChange,
  }
}
