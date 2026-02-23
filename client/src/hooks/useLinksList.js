import { useState, useCallback, useEffect, useRef } from "react"
import { getMyLinks } from "../api/links"
import { LINKS_PER_PAGE, SORT_OPTIONS } from "../constants"

export function useLinksList(user) {
  const [displayedLinks, setDisplayedLinks] = useState([])
  const [displayedLinksLoading, setDisplayedLinksLoading] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [linksTotal, setLinksTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(SORT_OPTIONS.NEWEST)
  const sortRef = useRef(sort)
  const loadedRef = useRef(false)

  sortRef.current = sort

  const totalPages = Math.max(1, Math.ceil(linksTotal / LINKS_PER_PAGE))

  const fetchPage = useCallback(
    ({ page, sort: sortBy = sortRef.current, onLoaded } = {}) => {
      if (!user) return
      setDisplayedLinksLoading(true)
      getMyLinks(page, sortBy)
        .then(({ links, total }) => {
          setDisplayedLinks(links)
          setLinksTotal(total)
          setCurrentPage(page)
          setSelectedLink((prev) => {
            if (!prev?.key) return prev
            return links.find((l) => l.key === prev.key) || prev
          })
          if (typeof onLoaded === "function") {
            requestAnimationFrame(() => requestAnimationFrame(() => onLoaded()))
          }
        })
        .catch(() => {
          setDisplayedLinks([])
          setLinksTotal(0)
        })
        .finally(() => setDisplayedLinksLoading(false))
    },
    [user]
  )

  useEffect(() => {
    loadedRef.current = false
    setDisplayedLinks([])
    setLinksTotal(0)
    setSelectedLink(null)
    setCurrentPage(1)
    setSort(SORT_OPTIONS.NEWEST)
  }, [user])

  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true
    fetchPage({ page: 1, sort: SORT_OPTIONS.NEWEST })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback(
    ({ page, onLoaded } = {}) => {
      if (page < 1 || page > totalPages) return
      fetchPage({ page, onLoaded })
    },
    [fetchPage, totalPages]
  )

  const changeSort = useCallback(
    (newSort) => {
      if (newSort === sort) return
      setSort(newSort)
      setCurrentPage(1)
      fetchPage({ page: 1, sort: newSort })
    },
    [sort, fetchPage]
  )

  return {
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
  }
}
