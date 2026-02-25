import { useCallback, useEffect, useState } from "react"
import { formatApiError } from "../api/errors"
import { getDashboardStats } from "../api/links"

const INITIAL_STATE = { totalLinks: 0, totalClicks: 0, topLocation: null, loading: true, error: null }
const EMPTY_STATE = { ...INITIAL_STATE, loading: false }

export function useDashboardStats(user) {
  const [state, setState] = useState(user ? INITIAL_STATE : EMPTY_STATE)

  const fetchStats = useCallback(() => {
    if (!user) return
    setState((s) => ({ ...s, loading: true, error: null }))
    getDashboardStats()
      .then(({ totalLinks, totalClicks, topLocation }) => {
        setState({ totalLinks, totalClicks, topLocation, loading: false, error: null })
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: formatApiError(err),
        }))
      })
  }, [user])

  useEffect(() => {
    if (!user) {
      setState(EMPTY_STATE)
      return
    }
    setState(INITIAL_STATE)
    fetchStats()
  }, [user, fetchStats])

  return { ...state, refetch: fetchStats }
}
