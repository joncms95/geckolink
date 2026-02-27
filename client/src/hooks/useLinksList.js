import { useCallback, useEffect, useRef, useState } from "react";
import { getMyLinks } from "../api/links";
import { LINKS_PER_PAGE, SORT_OPTIONS } from "../constants";

/**
 * Manages the paginated, sortable list of user links.
 * Fetches from getMyLinks() and exposes state + actions for DashboardPage.
 */
export function useLinksList(user) {
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [linksTotal, setLinksTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState(SORT_OPTIONS.NEWEST);

  // Refs to access latest sort without re-creating fetchPage, and to prevent double-fetch on mount
  const sortRef = useRef(sort);
  const loadedRef = useRef(false);

  sortRef.current = sort;

  const totalPages = Math.max(1, Math.ceil(linksTotal / LINKS_PER_PAGE));

  const fetchPage = useCallback(
    ({ page, sort: sortBy = sortRef.current, onLoaded } = {}) => {
      if (!user) return;
      setLinksLoading(true);
      getMyLinks(page, sortBy)
        .then(({ links: fetched, total }) => {
          setLinks(fetched);
          setLinksTotal(total);
          setCurrentPage(page);
          setSelectedLink((prev) => {
            if (!prev?.key) return prev;
            return fetched.find((l) => l.key === prev.key) || prev;
          });
          if (typeof onLoaded === "function") {
            requestAnimationFrame(() =>
              requestAnimationFrame(() => onLoaded()),
            );
          }
        })
        .catch(() => {
          setLinks([]);
          setLinksTotal(0);
        })
        .finally(() => setLinksLoading(false));
    },
    [user],
  );

  // Reset all state when user changes (login/logout)
  useEffect(() => {
    loadedRef.current = false;
    setLinks([]);
    setLinksTotal(0);
    setSelectedLink(null);
    setCurrentPage(1);
    setSort(SORT_OPTIONS.NEWEST);
  }, [user]);

  // Initial fetch — only runs once per user (loadedRef prevents double-fetch in StrictMode)
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;
    fetchPage({ page: 1, sort: SORT_OPTIONS.NEWEST });
    // Intentionally exclude fetchPage so this runs only once per user; loadedRef prevents double-fetch in StrictMode.
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback(
    ({ page, onLoaded } = {}) => {
      if (page < 1 || page > totalPages) return;
      fetchPage({ page, onLoaded });
    },
    [fetchPage, totalPages],
  );

  const changeSort = useCallback(
    (newSort) => {
      if (newSort === sort) return;
      setSort(newSort);
      setCurrentPage(1);
      fetchPage({ page: 1, sort: newSort });
    },
    [sort, fetchPage],
  );

  const refetch = useCallback(() => {
    fetchPage({ page: currentPage, sort });
  }, [fetchPage, currentPage, sort]);

  return {
    links,
    linksLoading,
    linksTotal,
    currentPage,
    totalPages,
    sort,
    goToPage,
    changeSort,
    refetch,
    selectedLink,
    setSelectedLink,
  };
}
