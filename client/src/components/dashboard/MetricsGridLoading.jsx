/**
 * Full-width loading placeholder for a metrics grid.
 * Use when aggregate or per-link stats are loading so we show a spinner
 * instead of placeholder numbers (e.g. 0).
 * @param {number} colSpan - 2 for two metric cards (detail view), 4 for four (dashboard)
 */
export default function MetricsGridLoading({
  colSpan = 4,
  ariaLabel = "Loading stats",
}) {
  const gridClass = colSpan === 2 ? "col-span-2" : "col-span-2 lg:col-span-4";
  return (
    <div
      className={`${gridClass} flex items-center justify-center py-8`}
      aria-label={ariaLabel}
    >
      <span className="text-gecko-slate">
        <i className="fa-solid fa-spinner fa-spin text-2xl" aria-hidden />
      </span>
    </div>
  );
}
