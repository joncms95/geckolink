export default function InlineError({ message, onRetry, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between ${className}`}
      role="alert"
    >
      <p className="text-red-400 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-gecko-green hover:text-gecko-green-light ml-4 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green rounded"
        >
          Retry
        </button>
      )}
    </div>
  )
}
