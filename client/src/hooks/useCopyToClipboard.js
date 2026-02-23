import { useCallback } from "react"

export default function useCopyToClipboard() {
  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }, [])

  return { copy }
}
