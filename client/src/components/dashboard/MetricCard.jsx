export default function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gecko-dark-border bg-gecko-dark-card p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-end">
        <i className={`fa-solid ${icon} text-lg sm:text-xl text-gecko-green`} aria-hidden />
      </div>
      <p
        className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-white tabular-nums truncate"
        title={String(value)}
      >
        {value}
      </p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gecko-slate">{label}</p>
    </div>
  )
}
