import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { UnauthorizedError } from "../api/client"
import { useAuth } from "./useAuth"
import { useToast } from "./useToast"
import { SESSION_INVALIDATED_TOAST_MS } from "../constants"

// Wraps an async API call with centralized 401 handling.
// On UnauthorizedError: clears session, navigates home, shows toast.
export function useApiCall() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  return useCallback(
    async (apiFn) => {
      try {
        return await apiFn()
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          clearSession()
          navigate("/")
          showToast("Your session has ended. Please log in again to continue.", SESSION_INVALIDATED_TOAST_MS)
          return undefined
        }
        throw err
      }
    },
    [clearSession, navigate, showToast]
  )
}
