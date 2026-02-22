import { useState, useCallback, useEffect, useRef } from "react"
import { getLinks } from "../api/links"
import { DASHBOARD_PAGE_SIZE, MAX_RECENT_ANONYMOUS } from "../constants"
import { loadRecentLinks, saveRecentLinks } from "../utils/recentLinksStorage"

export function useLinksList(user, isDashboard, recentLinks, setRecentLinks) {
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [linksTotal, setLinksTotal] = useState(0)
  const [linksPage, setLinksPage] = useState(1)
  const dashboardLoadedRef = useRef(false)
  const previousUserRef = useRef(user)

  if (previousUserRef.current !== user) {
    previousUserRef.current = user
    dashboardLoadedRef.current = false
  }

  useEffect(() => {
    if (!user) saveRecentLinks(recentLinks)
  }, [user, recentLinks])

  useEffect(() => {
    if (!isDashboard) {
      dashboardLoadedRef.current = false
      setLinksPage(1)
      return
    }
    if (dashboardLoadedRef.current) return
    dashboardLoadedRef.current = true
    setDisplayedLinksLoading(true)

    if (!user) {
      const codes = recentLinks.map((l) => l?.short_code).filter(Boolean)
      if (codes.length === 0) {
        setDisplayedLinks([])
        setLinksTotal(0)
        setLinksPage(1)
        setDisplayedLinksLoading(false)
        return
      }
      getLinks(1, DASHBOARD_PAGE_SIZE, codes)
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
      return
    }
    getLinks(1, DASHBOARD_PAGE_SIZE)
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

  const addToRecent = useCallback((link) => {
    if (user) {
      if (isDashboard) {
        setDisplayedLinks((prev) => {
          const exists = prev.some((l) => l.short_code === link.short_code)
          if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
          return [{ ...link }, ...prev]
        })
        setLinksTotal((prev) => prev + 1)
      }
    } else {
      setRecentLinks((prev) => {
        const rest = prev.filter((l) => l.short_code !== link.short_code)
        return [{ ...link }, ...rest].slice(0, MAX_RECENT_ANONYMOUS)
      })
      if (isDashboard) {
        setDisplayedLinks((prev) => {
          const exists = prev.some((l) => l.short_code === link.short_code)
          if (exists) return prev.map((l) => (l.short_code === link.short_code ? { ...link } : l))
          return [{ ...link }, ...prev]
        })
        setLinksTotal((prev) => prev + 1)
      }
    }
  }, [user, isDashboard])

  const loadMoreLinks = useCallback(() => {
    if (displayedLinks.length >= linksTotal) return
    setDisplayedLinksLoading(true)

    if (!user) {
      const codes = recentLinks.map((l) => l.short_code).filter(Boolean)
      getLinks(linksPage + 1, DASHBOARD_PAGE_SIZE, codes)
        .then(({ links }) => {
          setDisplayedLinks((prev) => [...prev, ...links])
          setLinksPage((p) => p + 1)
        })
        .finally(() => setDisplayedLinksLoading(false))
      return
    }
    getLinks(linksPage + 1, DASHBOARD_PAGE_SIZE)
      .then(({ links }) => {
        setDisplayedLinks((prev) => [...prev, ...links])
        setLinksPage((p) => p + 1)
      })
      .finally(() => setDisplayedLinksLoading(false))
  }, [user, displayedLinks.length, linksTotal, linksPage, recentLinks])

  const resetAfterAuthChange = useCallback(() => {
    setDisplayedLinks([])
    setLinksTotal(0)
    setSelectedLink(null)
    setLinksPage(1)
    dashboardLoadedRef.current = false
  }, [])

  const updateLinkInRecent = useCallback((shortCode, updatedLink) => {
    setRecentLinks((prev) =>
      prev.map((l) => (l.short_code === shortCode ? { ...l, ...updatedLink } : l))
    )
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
    addToRecent,
    updateLinkInRecent,
    resetAfterAuthChange,
  }
}
