import { useCallback, useState } from "react"
import { getLink } from "../../api/links"
import { SCROLL_TARGETS } from "../../constants"
import { formatApiError } from "../../api/errors"
import { parseShortKey } from "../../utils/shortKey"
import Button from "../ui/Button"
import Input from "../ui/Input"

export default function LookupForm({ onResult }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const key = parseShortKey(value)
      if (!key) {
        setError("Paste a short link or enter its key (e.g. TJTRrCl)")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const link = await getLink(key)
        setValue("")
        onResult(link)
      } catch (err) {
        const message =
          err?.status === 404
            ? "Short link not found. Check the URL or code and try again."
            : formatApiError(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [value, onResult]
  )

  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4">
      <p className="text-xs sm:text-sm text-gecko-slate mb-3">
        Already have a short link? Paste it below to load its analytics.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="Paste short link or code to view analytics"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            disabled={loading}
            className="flex-1 min-w-0"
          />
          <Button type="submit" disabled={loading} className="shrink-0 px-5 py-3 rounded-xl">
            {loading ? "Loading…" : "View analytics"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      </form>
      <p className="mt-3 text-gecko-slate text-xs sm:text-sm" data-scroll-target={SCROLL_TARGETS.LINK_LIST}>
        Click <strong className="text-white">View Stats →</strong> on a short link below to see
        detailed analytics, including clicks over time, top locations, and a usage report.
      </p>
    </div>
  )
}
